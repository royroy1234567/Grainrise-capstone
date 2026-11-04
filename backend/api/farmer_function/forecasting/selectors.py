from datetime import date



from django.db import connection





# ============================================================

# FARMER FORECASTING

# SELECTORS

# ============================================================

#

# PURPOSE:

#

# Read-only PostgreSQL access for Farmer Forecasting.

#

# SECURITY:

#

# farmer_user_id must always come from:

#

#     request.grainrise_farmer_id

#

# which is populated by the existing Farmer JWT guard.

#

# Never accept farmer_user_id from React as ownership authority.

#

# ============================================================





VALID_GRANULARITIES = {

    "weekly",

    "monthly",

}



VALID_PRODUCT_TYPES = {

    "unmilled_palay",

    "milled_rice",

}



VALID_CLIMATE_DATA_KINDS = {

    "historical",

    "forecast",

}



DEMAND_NEWS_CATEGORIES = {

    "market_updates",

    "supply_chain",

    "policy_regulation",

    "weather_climate",

    "general_agriculture",

}





# ============================================================

# DATABASE RESULT HELPERS

# ============================================================





def _rows_to_dicts(cursor):

    if not cursor.description:

        return []



    columns = [

        column[0]

        for column in cursor.description

    ]



    return [

        dict(zip(columns, row))

        for row in cursor.fetchall()

    ]





def _row_to_dict(cursor):

    row = cursor.fetchone()



    if row is None:

        return None



    columns = [

        column[0]

        for column in cursor.description

    ]



    return dict(zip(columns, row))





# ============================================================

# NORMALIZATION HELPERS

# ============================================================





def _normalize_farmer_id(farmer_user_id):

    try:

        farmer_id = int(farmer_user_id)

    except (TypeError, ValueError) as exc:

        raise ValueError(

            "Invalid authenticated Farmer ID."

        ) from exc



    if farmer_id <= 0:

        raise ValueError(

            "Invalid authenticated Farmer ID."

        )



    return farmer_id





def _normalize_positive_id(value, field_name):

    try:

        normalized = int(value)

    except (TypeError, ValueError) as exc:

        raise ValueError(

            f"Invalid {field_name}."

        ) from exc



    if normalized <= 0:

        raise ValueError(

            f"Invalid {field_name}."

        )



    return normalized





def _normalize_text(value):

    return str(value or "").strip()





def _normalize_product_type(value):

    normalized = _normalize_text(value).lower()



    if normalized not in VALID_PRODUCT_TYPES:

        raise ValueError(

            "Invalid Demand Forecast product type."

        )



    return normalized





def _normalize_rice_variety(value):

    normalized = _normalize_text(value)



    if not normalized:

        raise ValueError(

            "Rice variety is required for Demand Forecasting."

        )



    return normalized





def _normalize_granularity(value):

    normalized = _normalize_text(value).lower()



    if normalized not in VALID_GRANULARITIES:

        raise ValueError(

            "Forecast granularity must be weekly or monthly."

        )



    return normalized





def _normalize_date(value, field_name):

    if isinstance(value, date):

        return value



    normalized = _normalize_text(value)



    if not normalized:

        raise ValueError(

            f"{field_name} is required."

        )



    try:

        return date.fromisoformat(normalized)

    except ValueError as exc:

        raise ValueError(

            f"{field_name} must use YYYY-MM-DD format."

        ) from exc





def _normalize_date_range(start_date, end_date):

    normalized_start = _normalize_date(

        start_date,

        "Start date",

    )

    normalized_end = _normalize_date(

        end_date,

        "End date",

    )



    if normalized_start > normalized_end:

        raise ValueError(

            "Start date cannot be after end date."

        )



    return normalized_start, normalized_end





def _normalize_coordinate(value, field_name, minimum, maximum):

    try:

        normalized = round(float(value), 6)

    except (TypeError, ValueError) as exc:

        raise ValueError(

            f"Invalid {field_name}."

        ) from exc



    if not minimum <= normalized <= maximum:

        raise ValueError(

            f"Invalid {field_name}."

        )



    return normalized





# ============================================================

# CLIMATE FORECAST FARM OPTIONS

# ============================================================





PHILIPPINE_MUNICIPALITY_COORDINATES = {

    "cabanatuan city": (15.4859, 120.9673),

    "gapan city": (15.3087, 120.9472),

    "san jose city": (15.7903, 120.9981),

    "palayan city": (15.5414, 121.0847),

    "talavera": (15.5847, 120.9197),

    "guimba": (15.6586, 120.7672),

    "muñoz (science city)": (15.7139, 120.9056),

    "pantabangan": (15.8200, 121.1500),

    "cauayan city": (16.9248, 121.7744),

    "santiago city": (16.6917, 121.5475),

    "ilagan city": (17.1481, 121.8883),

    "alicia": (16.7797, 121.6975),

    "roxas": (17.1206, 121.6197),

    "tarlac city": (15.4802, 120.5979),

    "concepcion": (15.3242, 120.6558),

    "capas": (15.3347, 120.5897),

    "paniqui": (15.6664, 120.5819),

    "dagupan city": (16.0433, 120.3339),

    "urdaneta city": (15.9761, 120.5711),

    "san carlos city": (15.9281, 120.3489),

    "rosales": (15.8925, 120.5986),

    "san fernando city": (15.0344, 120.6847),

    "angeles city": (15.1450, 120.5887),

    "arayat": (15.1500, 120.7667),

    "magalang": (15.2208, 120.6606),

    "malolos city": (14.8527, 120.8160),

    "plaridel": (14.8872, 120.8572),

    "san ildefonso": (15.0786, 120.9417),

    "san miguel": (15.1439, 120.9769),

    "iloilo city": (10.7202, 122.5621),

    "pototan": (10.9483, 122.6289),

    "dingle": (11.0028, 122.6711),

}





def _lookup_city_coordinates(municipality, province):

    m_clean = str(municipality or "").strip().lower()

    if m_clean in PHILIPPINE_MUNICIPALITY_COORDINATES:

        return PHILIPPINE_MUNICIPALITY_COORDINATES[m_clean]



    p_clean = str(province or "").strip().lower()

    prov_defaults = {

        "nueva ecija": (15.4859, 120.9673),

        "isabela": (16.9754, 121.8107),

        "tarlac": (15.4802, 120.5979),

        "pangasinan": (15.9281, 120.3347),

        "pampanga": (15.0794, 120.6200),

        "bulacan": (14.8527, 120.8160),

        "iloilo": (10.7202, 122.5621),

    }

    return prov_defaults.get(p_clean, (15.4859, 120.9673))





def list_farmer_forecast_farms(farmer_user_id):

    """

    Return active registered farms owned by the authenticated

    Farmer for the Climate Forecasting location selector.

    """



    farmer_id = _normalize_farmer_id(

        farmer_user_id

    )



    with connection.cursor() as cursor:

        cursor.execute(

            """

            SELECT

                fp.farm_profile_id AS farm_id,

                fp.user_id,

                fp.farm_lot_name AS farm_name,

                COALESCE(fs.farm_status, 'Active') AS farm_status,

                fp.street_address,

                '' AS barangay,

                fp.municipality,

                fp.province,

                fp.postal_code,

                fp.street_address AS primary_geocode_query,

                fp.municipality AS barangay_geocode_query,

                fp.municipality AS municipality_geocode_query,

                NULL AS latitude,

                NULL AS longitude,

                'resolved' AS geocode_status,

                'municipality' AS geocode_match_level,

                'grainrise_geographic' AS geocode_provider,

                CONCAT_WS(', ', NULLIF(fp.farm_lot_name, ''), NULLIF(fp.municipality, ''), NULLIF(fp.province, '')) AS geocoded_address,

                fp.created_at AS geocode_updated_at

            FROM farm_profile fp

            LEFT JOIN existing_grainrise_farmer_farm_status fs

                ON fs.farm_profile_id = fp.farm_profile_id

            WHERE fp.user_id = %s

            ORDER BY

                COALESCE(NULLIF(TRIM(fp.farm_lot_name), ''), fp.municipality),

                fp.farm_profile_id

            """,

            [farmer_id],

        )



        rows = _rows_to_dicts(cursor)

        for r in rows:

            coords = _lookup_city_coordinates(r.get("municipality"), r.get("province"))

            r["latitude"] = coords[0]

            r["longitude"] = coords[1]

        return rows





def get_farmer_forecast_farm(

    farmer_user_id,

    farm_id,

):

    """

    Return one active registered farm only when it belongs to

    the authenticated Farmer.

    """



    farmer_id = _normalize_farmer_id(

        farmer_user_id

    )

    normalized_farm_id = _normalize_positive_id(

        farm_id,

        "farm ID",

    )



    with connection.cursor() as cursor:

        cursor.execute(

            """

            SELECT

                fp.farm_profile_id AS farm_id,

                fp.user_id,

                fp.farm_lot_name AS farm_name,

                COALESCE(fs.farm_status, 'Active') AS farm_status,

                fp.street_address,

                '' AS barangay,

                fp.municipality,

                fp.province,

                fp.postal_code,

                fp.street_address AS primary_geocode_query,

                fp.municipality AS barangay_geocode_query,

                fp.municipality AS municipality_geocode_query,

                NULL AS latitude,

                NULL AS longitude,

                'resolved' AS geocode_status,

                'municipality' AS geocode_match_level,

                'grainrise_geographic' AS geocode_provider,

                CONCAT_WS(', ', NULLIF(fp.farm_lot_name, ''), NULLIF(fp.municipality, ''), NULLIF(fp.province, '')) AS geocoded_address,

                fp.created_at AS geocode_updated_at

            FROM farm_profile fp

            LEFT JOIN existing_grainrise_farmer_farm_status fs

                ON fs.farm_profile_id = fp.farm_profile_id

            WHERE fp.farm_profile_id = %s

              AND fp.user_id = %s

            LIMIT 1

            """,

            [

                normalized_farm_id,

                farmer_id,

            ],

        )



        row = _row_to_dict(cursor)

        if row:

            coords = _lookup_city_coordinates(row.get("municipality"), row.get("province"))

            row["latitude"] = coords[0]

            row["longitude"] = coords[1]

        return row





# ============================================================

# FRESH CLIMATE CACHE LOOKUP

# ============================================================





def get_fresh_climate_fetch(

    *,

    provider_code,

    dataset_code,

    data_kind,

    latitude,

    longitude,

    requested_start_date,

    requested_end_date,

    granularity,

    variable_set_key,

    forecast_issue_date=None,

):

    """

    Return one unexpired successful climate cache header that

    exactly matches the normalized request.

    """



    provider = _normalize_text(provider_code)

    dataset = _normalize_text(dataset_code)

    kind = _normalize_text(data_kind).lower()

    normalized_granularity = _normalize_granularity(

        granularity

    )

    variables = _normalize_text(variable_set_key)



    if not provider:

        raise ValueError(

            "Climate provider is required."

        )



    if not dataset:

        raise ValueError(

            "Climate dataset is required."

        )



    if kind not in VALID_CLIMATE_DATA_KINDS:

        raise ValueError(

            "Invalid climate data kind."

        )



    if not variables:

        raise ValueError(

            "Climate variable set is required."

        )



    normalized_latitude = _normalize_coordinate(

        latitude,

        "latitude",

        -90,

        90,

    )

    normalized_longitude = _normalize_coordinate(

        longitude,

        "longitude",

        -180,

        180,

    )



    start_date, end_date = _normalize_date_range(

        requested_start_date,

        requested_end_date,

    )



    normalized_issue_date = None

    if forecast_issue_date not in (None, ""):

        normalized_issue_date = _normalize_date(

            forecast_issue_date,

            "Forecast issue date",

        )



    if kind == "historical" and normalized_issue_date is not None:

        raise ValueError(

            "Historical climate data cannot have a forecast issue date."

        )



    if kind == "forecast" and normalized_issue_date is None:

        raise ValueError(

            "Forecast issue date is required for forecast climate data."

        )



    with connection.cursor() as cursor:

        cursor.execute(

            """

            SELECT

                climate_fetch_id,

                provider_code,

                dataset_code,

                data_kind,

                latitude,

                longitude,

                location_label,

                requested_start_date,

                requested_end_date,

                forecast_issue_date,

                granularity,

                variable_set_key,

                fetch_status,

                requested_at,

                completed_at,

                expires_at,

                provider_metadata

            FROM climate_api_fetches

            WHERE provider_code = %s

              AND dataset_code = %s

              AND data_kind = %s

              AND latitude = %s

              AND longitude = %s

              AND requested_start_date = %s

              AND requested_end_date = %s

              AND forecast_issue_date IS NOT DISTINCT FROM %s

              AND granularity = %s

              AND variable_set_key = %s

              AND fetch_status = 'success'

              AND expires_at > CURRENT_TIMESTAMP

            ORDER BY completed_at DESC

            LIMIT 1

            """,

            [

                provider,

                dataset,

                kind,

                normalized_latitude,

                normalized_longitude,

                start_date,

                end_date,

                normalized_issue_date,

                normalized_granularity,

                variables,

            ],

        )



        return _row_to_dict(cursor)





def get_climate_fetch_points(climate_fetch_id):

    """

    Return normalized data points for one climate cache batch.

    """



    fetch_id = _normalize_positive_id(

        climate_fetch_id,

        "climate fetch ID",

    )



    with connection.cursor() as cursor:

        cursor.execute(

            """

            SELECT

                climate_data_point_id,

                climate_fetch_id,

                variable_code,

                source_variable_name,

                period_start,

                period_end,

                value,

                unit_code,

                aggregation_method,

                quality_metadata

            FROM climate_data_points

            WHERE climate_fetch_id = %s

            ORDER BY

                period_start ASC,

                variable_code ASC,

                climate_data_point_id ASC

            """,

            [fetch_id],

        )



        return _rows_to_dicts(cursor)





# ============================================================

# DEMAND FORECAST PRODUCT OPTIONS (MYSQL COMPATIBLE)
# ============================================================


def _month_add_date(base: date, months: int) -> date:
    import calendar
    total = base.year * 12 + base.month - 1 + months
    year, month_index = divmod(total, 12)
    month = month_index + 1
    day = min(base.day, calendar.monthrange(year, month)[1])
    return date(year, month, day)


def _generate_period_ranges(start_date: date, end_date: date, granularity: str):
    import calendar
    from datetime import timedelta
    periods = []
    if granularity == "weekly":
        curr = start_date - timedelta(days=start_date.weekday())
        while curr <= end_date:
            p_end = curr + timedelta(days=6)
            periods.append((curr, p_end))
            curr += timedelta(days=7)
    else:
        curr = date(start_date.year, start_date.month, 1)
        while curr <= end_date:
            last_day = calendar.monthrange(curr.year, curr.month)[1]
            p_end = date(curr.year, curr.month, last_day)
            periods.append((curr, p_end))
            curr = _month_add_date(curr, 1)
    return periods


def list_farmer_demand_products(farmer_user_id):
    """
    Return farmer-owned products and available forecasting varieties.
    """
    farmer_id = _normalize_farmer_id(farmer_user_id)

    query = """
    SELECT
        p.farm_product_id AS product_id,
        p.rice_variety,
        p.product_type,
        p.product_grade,
        p.stock_quantity_kg,
        p.selling_price_per_kg,
        COALESCE(sales.total_sold_kg, 0) AS lifetime_quantity_sold_kg,
        COALESCE(sales.transaction_count, 0) AS lifetime_transaction_count,
        sales.first_sale_date,
        sales.latest_sale_date,
        COALESCE(contracts.realized_kg, 0) AS realized_contract_quantity_kg,
        COALESCE(contracts.committed_kg, 0) AS committed_contract_quantity_kg,
        contracts.first_contract_date,
        contracts.latest_contract_date,
        COALESCE(biddings.open_bidding_kg, 0) AS open_bidding_quantity_kg,
        COALESCE(biddings.bidding_count, 0) AS open_bidding_count
    FROM existing_grainrise_farmer_products p
    JOIN farm_profile fp ON fp.farm_profile_id = p.farm_profile_id
    LEFT JOIN (
        SELECT
            farm_product_id,
            SUM(quantity_sold) AS total_sold_kg,
            COUNT(*) AS transaction_count,
            MIN(DATE(created_at)) AS first_sale_date,
            MAX(DATE(created_at)) AS latest_sale_date
        FROM existing_grainrise_farmer_pos_transactions
        GROUP BY farm_product_id
    ) sales ON sales.farm_product_id = p.farm_product_id
    LEFT JOIN (
        SELECT
            farm_product_id,
            SUM(CASE WHEN LOWER(contract_status) IN ('fulfilled', 'completed') THEN contracted_quantity_kg ELSE 0 END) AS realized_kg,
            SUM(CASE WHEN LOWER(contract_status) IN ('active', 'signed') THEN contracted_quantity_kg ELSE 0 END) AS committed_kg,
            MIN(contract_start_date) AS first_contract_date,
            MAX(fulfillment_date) AS latest_contract_date
        FROM existing_grainrise_farmer_contracts
        GROUP BY farm_product_id
    ) contracts ON contracts.farm_product_id = p.farm_product_id
    LEFT JOIN (
        SELECT
            farm_product_id,
            SUM(quantity_open_kg) AS open_bidding_kg,
            COUNT(*) AS bidding_count
        FROM existing_grainrise_farmer_open_biddings
        WHERE LOWER(bidding_status) = 'open'
        GROUP BY farm_product_id
    ) biddings ON biddings.farm_product_id = p.farm_product_id
    WHERE fp.user_id = %s
    ORDER BY p.rice_variety, p.farm_product_id
    """

    with connection.cursor() as cursor:
        cursor.execute(query, [farmer_id])
        cols = [c[0] for c in cursor.description]
        raw_rows = [dict(zip(cols, r)) for r in cursor.fetchall()]

    products = []
    for r in raw_rows:
        sold_kg = float(r.get("lifetime_quantity_sold_kg") or 0.0)
        comm_kg = float(r.get("committed_contract_quantity_kg") or 0.0)
        real_kg = float(r.get("realized_contract_quantity_kg") or 0.0)
        bid_kg = float(r.get("open_bidding_quantity_kg") or 0.0)

        products.append({
            "product_id": int(r["product_id"]),
            "product_name": r.get("rice_variety") or "Farmer Product",
            "rice_variety": r.get("rice_variety"),
            "product_type": r.get("product_type") or "Unmilled Palay",
            "product_grade": r.get("product_grade") or "Grade 1",
            "stock_quantity_kg": float(r.get("stock_quantity_kg") or 0.0),
            "selling_price_per_kg": float(r.get("selling_price_per_kg") or 0.0),
            "lifetime_quantity_sold_kg": sold_kg,
            "lifetime_transaction_count": int(r.get("lifetime_transaction_count") or 0),
            "first_sale_date": r.get("first_sale_date"),
            "latest_sale_date": r.get("latest_sale_date"),
            "realized_contract_quantity_kg": real_kg,
            "committed_contract_quantity_kg": comm_kg,
            "first_contract_date": r.get("first_contract_date"),
            "latest_contract_date": r.get("latest_contract_date"),
            "open_bidding_quantity_kg": bid_kg,
            "open_bidding_count": int(r.get("open_bidding_count") or 0),
            "has_sales_history": sold_kg > 0,
            "has_contract_history": (comm_kg > 0 or real_kg > 0),
            "has_bidding_history": bid_kg > 0,
        })

    # Ensure NSIC Rc 160 is selectable as well so the farmer can evaluate & compare both varieties
    if not any("160" in (p.get("rice_variety") or "") for p in products):
        products.append({
            "product_id": 992,
            "product_name": "NSIC Rc 160",
            "rice_variety": "NSIC Rc 160",
            "product_type": "Unmilled Palay",
            "product_grade": "Grade 2",
            "stock_quantity_kg": 0.0,
            "selling_price_per_kg": 22.0,
            "lifetime_quantity_sold_kg": 0.0,
            "lifetime_transaction_count": 0,
            "first_sale_date": None,
            "latest_sale_date": None,
            "realized_contract_quantity_kg": 0.0,
            "committed_contract_quantity_kg": 0.0,
            "first_contract_date": None,
            "latest_contract_date": None,
            "open_bidding_quantity_kg": 0.0,
            "open_bidding_count": 0,
            "has_sales_history": False,
            "has_contract_history": False,
            "has_bidding_history": False,
        })

    return products


def get_farmer_sales_demand_series(
    farmer_user_id,
    *,
    farm_product_id=None,
    product_type=None,
    rice_variety=None,
    granularity,
    start_date,
    end_date,
):
    """
    Return weekly/monthly POS demand series grouped by contiguous periods.
    """
    from django.utils import timezone

    farmer_id = _normalize_farmer_id(farmer_user_id)
    gran = _normalize_granularity(granularity)
    norm_start, norm_end = _normalize_date_range(start_date, end_date)
    periods = _generate_period_ranges(norm_start, norm_end, gran)
    today = timezone.localdate()

    params = [farmer_id]
    where_clauses = ["fp.user_id = %s"]

    if farm_product_id:
        try:
            pid = int(farm_product_id)
            if pid > 0:
                where_clauses.append("p.farm_product_id = %s")
                params.append(pid)
        except (TypeError, ValueError):
            pass

    if len(params) == 1:
        if product_type:
            where_clauses.append("LOWER(TRIM(p.product_type)) = LOWER(TRIM(%s))")
            params.append(product_type)
        if rice_variety:
            where_clauses.append("LOWER(TRIM(p.rice_variety)) = LOWER(TRIM(%s))")
            params.append(rice_variety)

    where_sql = " AND ".join(where_clauses)

    query = f"""
    SELECT
        t.quantity_sold,
        t.price_per_kg,
        t.line_total,
        DATE(t.created_at) AS sale_date,
        t.reference_no
    FROM existing_grainrise_farmer_pos_transactions t
    JOIN existing_grainrise_farmer_products p ON p.farm_product_id = t.farm_product_id
    JOIN farm_profile fp ON fp.farm_profile_id = t.farm_profile_id
    WHERE {where_sql}
      AND DATE(t.created_at) BETWEEN %s AND %s
    """
    params.extend([norm_start, max(norm_end, today)])

    with connection.cursor() as cursor:
        cursor.execute(query, params)
        tx_rows = cursor.fetchall()

        cursor.execute("SELECT price_date, price_per_kg FROM existing_grainrise_farmer_palay_market_prices ORDER BY price_date")
        market_rows = cursor.fetchall()
        default_price = float(market_rows[-1][1]) if market_rows else 24.0

    result = []
    num_periods = len(periods)
    for index, (p_start, p_end) in enumerate(periods):
        is_last = (index == num_periods - 1)
        matching = [
            r for r in tx_rows
            if (p_start <= r[3] <= p_end) or (is_last and r[3] > p_end and r[3] <= today)
        ]
        if matching:
            qty = sum(float(r[0]) for r in matching)
            # Detect fulfilled contracts recorded as POS sales by reference number
            pos_contract_qty = sum(
                float(r[0]) for r in matching
                if r[4] and ("CTR" in str(r[4]).upper() or "CONTRACT" in str(r[4]).upper())
            )
            gross = sum(float(r[2]) for r in matching)
            tx_count = len(matching)
            unique_days = len(set(r[3] for r in matching))
            avg_price = (gross / qty) if qty > 0 else default_price
            has_sales = True
        else:
            qty = 0.0
            pos_contract_qty = 0.0
            gross = 0.0
            tx_count = 0
            unique_days = 0
            avg_price = default_price
            has_sales = False

        result.append({
            "period_start": p_start,
            "period_end": p_end,
            "quantity_sold_kg": qty,
            "pos_contract_quantity_kg": pos_contract_qty,
            "transaction_count": tx_count,
            "sales_day_count": unique_days,
            "gross_sales_amount": gross,
            "weighted_avg_selling_price_per_kg": avg_price,
            "minimum_selling_price_per_kg": avg_price,
            "maximum_selling_price_per_kg": avg_price,
            "has_sales": has_sales,
        })
    return result


def get_farmer_contract_demand_series(
    farmer_user_id,
    *,
    farm_product_id=None,
    product_type=None,
    rice_variety=None,
    granularity,
    start_date,
    end_date,
):
    """
    Return weekly/monthly contract commitments and fulfilled quantities.
    """
    farmer_id = _normalize_farmer_id(farmer_user_id)
    gran = _normalize_granularity(granularity)
    norm_start, norm_end = _normalize_date_range(start_date, end_date)
    periods = _generate_period_ranges(norm_start, norm_end, gran)

    params = [farmer_id]
    where_clauses = ["fp.user_id = %s"]

    if farm_product_id:
        try:
            pid = int(farm_product_id)
            if pid > 0:
                where_clauses.append("p.farm_product_id = %s")
                params.append(pid)
        except (TypeError, ValueError):
            pass

    if len(params) == 1:
        if product_type:
            where_clauses.append("LOWER(TRIM(p.product_type)) = LOWER(TRIM(%s))")
            params.append(product_type)
        if rice_variety:
            where_clauses.append("LOWER(TRIM(p.rice_variety)) = LOWER(TRIM(%s))")
            params.append(rice_variety)

    where_sql = " AND ".join(where_clauses)

    query = f"""
    SELECT
        c.contracted_quantity_kg,
        c.agreed_price_per_kg,
        c.contract_status,
        c.contract_start_date,
        c.fulfillment_date
    FROM existing_grainrise_farmer_contracts c
    JOIN existing_grainrise_farmer_products p ON p.farm_product_id = c.farm_product_id
    JOIN farm_profile fp ON fp.farm_profile_id = c.farm_profile_id
    WHERE {where_sql}
    """

    with connection.cursor() as cursor:
        cursor.execute(query, params)
        contract_rows = cursor.fetchall()

    result = []
    for p_start, p_end in periods:
        matching = [c for c in contract_rows if c[4] and p_start <= c[4] <= p_end]
        realized_qty = sum(float(c[0]) for c in matching if str(c[2]).lower() in ("fulfilled", "completed"))
        committed_qty = sum(float(c[0]) for c in matching if str(c[2]).lower() in ("active", "signed", "in_progress"))
        at_risk_qty = sum(float(c[0]) for c in matching if str(c[2]).lower() in ("void_requested", "at_risk"))
        prices = [float(c[1]) for c in matching if float(c[0]) > 0]
        avg_price = (sum(prices) / len(prices)) if prices else 24.50

        result.append({
            "period_start": p_start,
            "period_end": p_end,
            "realized_contract_quantity_kg": realized_qty,
            "committed_contract_quantity_kg": committed_qty,
            "at_risk_contract_quantity_kg": at_risk_qty,
            "completed_contract_count": len([c for c in matching if str(c[2]).lower() in ("fulfilled", "completed")]),
            "active_contract_count": len([c for c in matching if str(c[2]).lower() in ("active", "signed", "in_progress")]),
            "void_requested_contract_count": len([c for c in matching if str(c[2]).lower() in ("void_requested", "at_risk")]),
            "realized_contract_value": realized_qty * avg_price,
            "committed_contract_value": committed_qty * avg_price,
            "at_risk_contract_value": at_risk_qty * avg_price,
            "weighted_avg_agreed_price_per_kg": avg_price,
            "contract_weighted_price": avg_price,
            "has_contract_signal": (committed_qty > 0 or realized_qty > 0),
        })
    return result


def list_demand_news_articles(
    *,
    start_date,
    end_date,
    limit=200,
):
    """
    Return agriculture/market news within the given date window.
    """
    norm_start, norm_end = _normalize_date_range(start_date, end_date)
    try:
        norm_limit = max(1, min(int(limit), 500))
    except (TypeError, ValueError):
        norm_limit = 200

    query = """
    SELECT
        news_id,
        title,
        description,
        article_body,
        has_full_article_body,
        source_name,
        source_domain,
        category_code,
        published_at,
        article_url
    FROM news_articles
    WHERE published_at BETWEEN %s AND %s
    ORDER BY published_at DESC
    LIMIT %s
    """

    try:
        with connection.cursor() as cursor:
            cursor.execute(query, [norm_start, norm_end, norm_limit])
            cols = [c[0] for c in cursor.description]
            return [dict(zip(cols, r)) for r in cursor.fetchall()]
    except Exception:
        return []
