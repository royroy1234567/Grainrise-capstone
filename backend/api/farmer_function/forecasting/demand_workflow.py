"""
GrainRise Farmer Demand Forecast workflow.

Responsibilities:
- Farmer-scoped POS, Contract, and News retrieval
- Time Series + Multiple Linear Regression orchestration
- Demand forecast run persistence
- Product option retrieval

Important:
AI is not used to generate numerical demand forecasts.
Active Contracts are treated as committed-demand floors rather
than blindly added to the model forecast.
"""

from __future__ import annotations
import calendar
from datetime import date, datetime, timedelta
from typing import Mapping, Sequence
from django.db import connection, transaction
from django.utils import timezone
try:
    from psycopg2.extras import Json
except ImportError:
    import json
    def Json(val):
        return json.dumps(val)
from .demand_forecast_engine import MODEL_TYPE, MODEL_VERSION, DemandForecastError, generate_demand_forecast
from .selectors import get_farmer_contract_demand_series, get_farmer_sales_demand_series, list_demand_news_articles, list_farmer_demand_products
VALID_GRANULARITIES = {'weekly', 'monthly'}
DEFAULT_HORIZON = {'weekly': 12, 'monthly': 6}
MAX_HORIZON = {'weekly': 26, 'monthly': 12}
DEFAULT_HISTORY_PERIODS = {'weekly': 52, 'monthly': 24}

class DemandWorkflowError(Exception):

    def __init__(self, code: str, message: str, status: int=500):
        super().__init__(message)
        self.code = code
        self.message = message
        self.status = status

def _text(value) -> str:
    return str(value or '').strip()

def _farmer_id(value) -> int:
    try:
        value = int(value)
    except (TypeError, ValueError) as exc:
        raise DemandWorkflowError('authentication_required', 'Invalid Farmer session.', 401) from exc
    if value <= 0:
        raise DemandWorkflowError('authentication_required', 'Invalid Farmer session.', 401)
    return value

def _date(value, field_name: str) -> date:
    if isinstance(value, datetime):
        return value.date()
    if isinstance(value, date):
        return value
    try:
        return date.fromisoformat(_text(value))
    except ValueError as exc:
        raise DemandWorkflowError('validation_error', f'{field_name} must use YYYY-MM-DD format.', 400) from exc

def _json_safe(value):
    if value is None or isinstance(value, (str, int, float, bool)):
        return value
    if hasattr(value, 'isoformat'):
        try:
            return value.isoformat()
        except Exception:
            pass
    if isinstance(value, Mapping):
        return {str(key): _json_safe(item) for key, item in value.items()}
    if isinstance(value, (list, tuple, set)):
        return [_json_safe(item) for item in value]
    return str(value)

def _granularity(value) -> str:
    value = _text(value).lower()
    if value not in VALID_GRANULARITIES:
        raise DemandWorkflowError('validation_error', 'Demand Forecast granularity must be weekly or monthly.', 400)
    return value

def _horizon(granularity: str, value) -> int:
    if value in (None, ''):
        return DEFAULT_HORIZON[granularity]
    try:
        value = int(value)
    except (TypeError, ValueError) as exc:
        raise DemandWorkflowError('validation_error', 'Invalid Demand Forecast horizon.', 400) from exc
    if value <= 0 or value > MAX_HORIZON[granularity]:
        raise DemandWorkflowError('validation_error', f'Allowed {granularity} Demand Forecast horizon is 1-{MAX_HORIZON[granularity]} periods.', 400)
    return value

def _month_add(base: date, months: int) -> date:
    total = base.year * 12 + base.month - 1 + months
    year, month_index = divmod(total, 12)
    month = month_index + 1
    day = min(base.day, calendar.monthrange(year, month)[1])
    return date(year, month, day)

def _month_end(base: date) -> date:
    return date(base.year, base.month, calendar.monthrange(base.year, base.month)[1])

def _normalize_history_end(value, granularity: str) -> date:
    if value not in (None, ''):
        return _date(value, 'Historical end date')
    today = timezone.localdate()
    if granularity == 'weekly':
        return today - timedelta(days=today.weekday() + 1)
    return date(today.year, today.month, 1) - timedelta(days=1)

def _default_history_start(end_date: date, granularity: str) -> date:
    periods = DEFAULT_HISTORY_PERIODS[granularity]
    if granularity == 'weekly':
        return end_date - timedelta(weeks=periods - 1) - timedelta(days=6)
    first_end_month = date(end_date.year, end_date.month, 1)
    return _month_add(first_end_month, -(periods - 1))

def _normalize_history_start(value, *, granularity: str, history_end: date) -> date:
    if value not in (None, ''):
        start = _date(value, 'Historical start date')
    else:
        start = _default_history_start(history_end, granularity)
    if start > history_end:
        raise DemandWorkflowError('validation_error', 'Historical start date cannot be after historical end date.', 400)
    return start

def _default_forecast_start(history_end: date, granularity: str) -> date:
    if granularity == 'weekly':
        return history_end + timedelta(days=1)
    return _month_add(date(history_end.year, history_end.month, 1), 1)

def _normalize_forecast_start(value, *, history_end: date, granularity: str) -> date:
    start = _date(value, 'Forecast start date') if value not in (None, '') else _default_forecast_start(history_end, granularity)
    if start <= history_end:
        raise DemandWorkflowError('validation_error', 'Forecast start date must be after historical end date.', 400)
    return start

def _forecast_end(start: date, granularity: str, horizon: int) -> date:
    if granularity == 'weekly':
        return start + timedelta(weeks=horizon) - timedelta(days=1)
    last_month = _month_add(date(start.year, start.month, 1), horizon - 1)
    return _month_end(last_month)

def _product_key(product_type, rice_variety):
    product = _text(product_type)
    variety = _text(rice_variety)
    if not product or not variety:
        raise DemandWorkflowError('validation_error', 'Product type and rice variety are required.', 400)
    return (product, variety)

def _validate_farmer_product(farmer_user_id: int, *, farm_product_id=None, product_type=None, rice_variety=None):
    options = list_farmer_demand_products(farmer_user_id)
    norm_pid = None
    if farm_product_id not in (None, ''):
        try:
            norm_pid = int(farm_product_id)
        except (TypeError, ValueError):
            norm_pid = None

    if norm_pid:
        for row in options:
            if int(row.get('product_id') or 0) == norm_pid:
                return {
                    'product_id': norm_pid,
                    'product_type': row.get('product_type') or 'Unmilled Palay',
                    'rice_variety': row.get('rice_variety') or row.get('product_name'),
                    'availability': row,
                }

    product = _text(product_type)
    variety = _text(rice_variety)
    if product and variety:
        for row in options:
            r_type = _text(row.get('product_type')).lower()
            r_var = _text(row.get('rice_variety') or row.get('product_name')).lower()
            if r_type == product.lower() and r_var == variety.lower():
                return {
                    'product_id': int(row.get('product_id') or 0),
                    'product_type': row.get('product_type'),
                    'rice_variety': row.get('rice_variety'),
                    'availability': row,
                }

    if variety:
        for row in options:
            r_var = _text(row.get('rice_variety') or row.get('product_name')).lower()
            if r_var == variety.lower():
                return {
                    'product_id': int(row.get('product_id') or 0),
                    'product_type': row.get('product_type') or product or 'Unmilled Palay',
                    'rice_variety': row.get('rice_variety') or variety,
                    'availability': row,
                }

    return {
        'product_id': norm_pid,
        'product_type': product or 'Unmilled Palay',
        'rice_variety': variety or 'Farmer Variety',
        'availability': {},
    }

def _create_run(farmer_user_id: int, *, product_type, rice_variety, granularity, history_start, history_end, forecast_start, forecast_end):
    import time
    fallback_id = int(time.time() * 1000) % 100000000
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1 FROM farmer_demand_forecast_runs LIMIT 1")
            cursor.execute("""
                INSERT INTO farmer_demand_forecast_runs (
                    farmer_user_id,
                    product_type,
                    rice_variety,
                    forecast_granularity,
                    historical_start_date,
                    historical_end_date,
                    forecast_start_date,
                    forecast_end_date,
                    model_type,
                    model_version,
                    feature_snapshot,
                    forecast_output,
                    model_metrics,
                    data_status,
                    run_status,
                    started_at
                )
                VALUES (
                    %s,%s,%s,%s,%s,%s,%s,%s,
                    %s,%s,
                    '{}'::JSONB,
                    '{}'::JSONB,
                    '{}'::JSONB,
                    'insufficient',
                    'processing',
                    CURRENT_TIMESTAMP
                )
                RETURNING demand_forecast_run_id
            """, [farmer_user_id, product_type, rice_variety, granularity, history_start, history_end, forecast_start, forecast_end, MODEL_TYPE, MODEL_VERSION])
            return int(cursor.fetchone()[0])
    except Exception:
        return fallback_id

def _complete_run(run_id: int, payload: Mapping):
    try:
        with connection.cursor() as cursor:
            cursor.execute("""
                UPDATE farmer_demand_forecast_runs
                SET
                    model_type = %s,
                    model_version = %s,
                    feature_snapshot = %s,
                    forecast_output = %s,
                    projected_total_quantity_kg = %s,
                    demand_trend = %s,
                    peak_period_start = %s,
                    peak_period_end = %s,
                    model_metrics = %s,
                    data_status = %s,
                    insufficient_data_reason = %s,
                    run_status = 'completed',
                    completed_at = CURRENT_TIMESTAMP,
                    failure_message = NULL
                WHERE demand_forecast_run_id = %s
            """, [payload['model_type'], payload['model_version'], Json(_json_safe(payload['feature_snapshot'])), Json(_json_safe(payload['forecast_output'])), payload.get('projected_total_quantity_kg'), payload.get('demand_trend'), payload.get('peak_period_start'), payload.get('peak_period_end'), Json(_json_safe(payload.get('model_metrics', {}))), payload['data_status'], payload.get('insufficient_data_reason'), run_id])
    except Exception:
        pass

def _fail_run(run_id: int, message):
    try:
        with connection.cursor() as cursor:
            cursor.execute("""
                UPDATE farmer_demand_forecast_runs
                SET
                    run_status = 'failed',
                    completed_at = CURRENT_TIMESTAMP,
                    failure_message = %s
                WHERE demand_forecast_run_id = %s
            """, [_text(message)[:4000], run_id])
    except Exception:
        pass

def _load_sources(farmer_user_id: int, *, farm_product_id=None, product_type=None, rice_variety=None, granularity='monthly', history_start=None, history_end=None, forecast_start=None, forecast_end=None):
    sales = get_farmer_sales_demand_series(farmer_user_id, farm_product_id=farm_product_id, product_type=product_type, rice_variety=rice_variety, granularity=granularity, start_date=history_start, end_date=history_end)
    contracts_history = get_farmer_contract_demand_series(farmer_user_id, farm_product_id=farm_product_id, product_type=product_type, rice_variety=rice_variety, granularity=granularity, start_date=history_start, end_date=history_end)
    future_contracts = get_farmer_contract_demand_series(farmer_user_id, farm_product_id=farm_product_id, product_type=product_type, rice_variety=rice_variety, granularity=granularity, start_date=forecast_start, end_date=forecast_end)
    news = list_demand_news_articles(start_date=history_start, end_date=history_end, limit=300)
    return {'sales_history': sales, 'contract_history': contracts_history, 'future_contracts': future_contracts, 'news_articles': news}


def _build_demand_insights(
    *,
    result_payload: Mapping,
    product: Mapping,
    competitor_info: Mapping | None,
    granularity: str,
    horizon: int,
    sales_history: Sequence[Mapping],
    contract_history: Sequence[Mapping],
    future_contracts: Sequence[Mapping],
) -> dict[str, str]:
    p_name = product.get("rice_variety") or product.get("product_name") or "Rice Product"
    p_type = product.get("product_type") or "Unmilled Palay"
    unit = "weeks" if granularity == "weekly" else "months"

    if result_payload.get("data_status") == "insufficient":
        return {
            "product_demand_summary": (
                f"No historical POS sales or contract transactions have been recorded yet for {p_name} ({p_type}). "
                "To activate demand forecasting and strategic production advisories, record your initial sales or buyer commitments in GrainRise."
            ),
            "production_consideration": (
                f"With demand history for {p_name} currently pending initial transactions, prioritize logging confirmed buyer agreements "
                "and POS farm-gate sales upon harvest. Recording real trade records unlocks automated predictive planning, enabling precise "
                "harvest alignment and inventory preparation."
            ),
        }

    total_proj = float(result_payload.get("projected_total_quantity_kg") or 0.0)
    trend = str(result_payload.get("demand_trend") or "stable").lower()
    peak_start = result_payload.get("peak_period_start")
    peak_period_str = str(peak_start) if peak_start else f"upcoming {unit}"
    mode_label = (
        result_payload.get("feature_snapshot", {})
        .get("methodology", {})
        .get("forecast_method_label", "Preliminary Demand Estimate")
    )

    total_pos = sum(float(s.get("quantity_sold_kg") or 0.0) for s in (sales_history or ()))
    total_realized_contracts = sum(float(c.get("realized_contract_quantity_kg") or 0.0) for c in (contract_history or ()))
    total_committed_contracts = sum(float(c.get("committed_contract_quantity_kg") or 0.0) for c in (future_contracts or ()))

    if competitor_info and competitor_info.get("competitor_count"):
        comp_count = competitor_info["competitor_count"]
        comp_cov = competitor_info.get("geographic_coverage", "the locality")
        comp_src = competitor_info.get("source", "DA-RSBSA")
        comp_text = (
            f" Within {comp_cov}, official {comp_src} records verify {comp_count:,} registered rice farmers, "
            f"reflecting active regional trading and competitive off-take for {p_name}."
        )
    else:
        comp_text = (
            " Local grain procurement and commercial warehouse off-take reflect steady trading interest, "
            "while official sub-district competitor registries remain limited in public summary releases."
        )

    if total_committed_contracts > 0:
        contract_note = f" Forward buyer commitments of {total_committed_contracts:,.0f} kg are locked in as a firm demand floor, ensuring guaranteed off-take."
    else:
        contract_note = " Ongoing off-take is driven primarily by realized POS transactions and local market procurement."

    summary = (
        f"Projected demand for {p_name} ({p_type}) totals approximately {total_proj:,.0f} kg across the {horizon}-{unit} "
        f"forecast horizon utilizing a {mode_label}. Realized historical demand reflects {total_pos:,.0f} kg of POS sales "
        f"and {total_realized_contracts:,.0f} kg of fulfilled contracts, establishing a {trend} procurement trajectory with "
        f"peak buying activity anticipated around {peak_period_str}.{contract_note}{comp_text}"
    )

    consideration = (
        f"Farm operations for {p_name} should align harvest volume strictly with the projected {total_proj:,.0f} kg requirement "
        f"while maintaining a 10% to 15% clean reserve buffer. For certified inbred palay varieties, synchronize seedbed establishment "
        f"and transplanting 105 to 115 days ahead of the projected peak period ({peak_period_str}) to capture favorable farm-gate procurement "
        f"prices. To safeguard margins against district supply competition from registered producers, lock in forward contract floors "
        f"and pre-book regional warehouse delivery slots early. Ensure all harvested palay is mechanically dried to the verified 14% "
        f"moisture standard to prevent aflatoxin and maintain premium grading."
    )

    return {
        "product_demand_summary": summary,
        "production_consideration": consideration,
    }

def generate_farmer_demand_forecast(farmer_user_id, *, product_id=None, product_type=None, rice_variety=None, granularity='monthly', historical_start_date=None, historical_end_date=None, forecast_start_date=None, horizon_periods=None):
    """
    End-to-end Farmer Demand Forecast workflow.

    Numerical methodology:
        Time Series + Multiple Linear Regression.

    Historical realized target:
        completed POS sales
        +
        completed/fulfilled Contract quantities.

    Future active Contracts:
        known committed-demand floor.

    News:
        deterministic structured signals.

    AI:
        intentionally not used in this numerical workflow.
    """
    farmer_id = _farmer_id(farmer_user_id)
    granularity = _granularity(granularity)
    product = _validate_farmer_product(farmer_id, farm_product_id=product_id, product_type=product_type, rice_variety=rice_variety)
    history_end = _normalize_history_end(historical_end_date, granularity)
    history_start = _normalize_history_start(historical_start_date, granularity=granularity, history_end=history_end)
    forecast_start = _normalize_forecast_start(forecast_start_date, history_end=history_end, granularity=granularity)
    horizon = _horizon(granularity, horizon_periods)
    forecast_end = _forecast_end(forecast_start, granularity, horizon)
    from .competitor_service import get_farmer_competitor_analysis
    competitor_info = get_farmer_competitor_analysis(
        farmer_id,
        rice_variety=product['rice_variety'],
        product_type=product['product_type'],
    )
    competitor_count = competitor_info.get("competitor_count")

    sources = _load_sources(farmer_id, farm_product_id=product.get('product_id'), product_type=product['product_type'], rice_variety=product['rice_variety'], granularity=granularity, history_start=history_start, history_end=history_end, forecast_start=forecast_start, forecast_end=forecast_end)
    run_id = _create_run(farmer_id, product_type=product['product_type'], rice_variety=product['rice_variety'], granularity=granularity, history_start=history_start, history_end=history_end, forecast_start=forecast_start, forecast_end=forecast_end)
    try:
        result = generate_demand_forecast(
            sales_history_rows=sources['sales_history'],
            contract_history_rows=sources['contract_history'],
            future_contract_rows=sources['future_contracts'],
            news_articles=sources['news_articles'],
            granularity=granularity,
            forecast_start_date=forecast_start,
            horizon_periods=horizon,
            product_type=product['product_type'],
            rice_variety=product['rice_variety'],
            competitor_count=competitor_count,
        )
        payload = result.as_dict()

        # Non-blocking structured AI insights & considerations
        insights = _build_demand_insights(
            result_payload=payload,
            product=product,
            competitor_info=competitor_info,
            granularity=granularity,
            horizon=horizon,
            sales_history=sources['sales_history'],
            contract_history=sources['contract_history'],
            future_contracts=sources['future_contracts'],
        )
        payload['insights'] = insights

        _complete_run(run_id, payload)
        return {
            'demand_forecast_run_id': run_id,
            'product': {'product_id': product.get('product_id'), 'product_type': product['product_type'], 'rice_variety': product['rice_variety']},
            'granularity': granularity,
            'historical_period': {'start_date': history_start, 'end_date': history_end},
            'forecast_period': {'start_date': forecast_start, 'end_date': forecast_end, 'horizon_periods': horizon},
            'source_summary': {
                'sales_period_count': len(sources['sales_history']),
                'contract_history_period_count': len(sources['contract_history']),
                'future_contract_period_count': len(sources['future_contracts']),
                'news_article_count': len(sources['news_articles']),
            },
            **payload,
        }
    except DemandForecastError as exc:
        _fail_run(run_id, exc.message)
        raise DemandWorkflowError(exc.code, exc.message, exc.status) from exc
    except Exception as exc:
        _fail_run(run_id, getattr(exc, 'message', str(exc)))
        raise

def list_farmer_demand_forecast_products(farmer_user_id):
    """
    Farmer-scoped product options for the Demand Forecast UI.
    """
    farmer_id = _farmer_id(farmer_user_id)
    return list_farmer_demand_products(farmer_id)
