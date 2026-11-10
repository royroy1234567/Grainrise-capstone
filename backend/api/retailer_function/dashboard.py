from datetime import timedelta
from decimal import Decimal
from zoneinfo import ZoneInfo

from django.db import connection
from django.utils import timezone
from rest_framework.decorators import api_view
from rest_framework.response import Response

from .retailer_auth import retailer_required

PH_TZ = ZoneInfo("Asia/Manila")


def _rows(cursor):
    columns = [column[0] for column in cursor.description]
    return [dict(zip(columns, row)) for row in cursor.fetchall()]


def _date(value):
    return value.isoformat() if value else None


def _money(value):
    return float(Decimal(str(value or 0)).quantize(Decimal("0.01")))


def _period_dates(period):
    today = timezone.localtime(timezone.now(), PH_TZ).date()
    if period == "Last 30 Days":
        return today - timedelta(days=29), today
    if period == "This Month":
        return today.replace(day=1), today
    return today - timedelta(days=6), today


@api_view(["GET"])
@retailer_required
def dashboard(request):
    period = str(request.query_params.get("period") or "Last 7 Days")
    start_date, end_date = _period_dates(period)
    user_id = request.retailer_user_id
    date_sql = "DATE(CONVERT_TZ(s.created_at, '+00:00', '+08:00')) BETWEEN %s AND %s"

    with connection.cursor() as cursor:
        cursor.execute(
            """
            SELECT
                COUNT(*) AS product_count,
                SUM(CASE WHEN stock_quantity >= 200 THEN 1 ELSE 0 END) AS in_stock,
                SUM(CASE WHEN stock_quantity > 0 AND stock_quantity < 200 THEN 1 ELSE 0 END) AS low_stock,
                SUM(CASE WHEN stock_quantity = 0 THEN 1 ELSE 0 END) AS no_stock
            FROM retailer_products
            WHERE retailer_user_id = %s AND LOWER(TRIM(status)) = 'active'
            """,
            [user_id],
        )
        inventory = cursor.fetchone() or (0, 0, 0, 0)

        cursor.execute(
            f"""
            SELECT COALESCE(SUM(s.total_payment), 0)
            FROM retailer_ftf_sales s
            WHERE s.retailer_user_id = %s
              AND DATE(CONVERT_TZ(s.created_at, '+00:00', '+08:00')) = %s
            """,
            [user_id, end_date],
        )
        sales_today = _money(cursor.fetchone()[0])

        cursor.execute(
            f"""
            SELECT
                DATE(CONVERT_TZ(s.created_at, '+00:00', '+08:00')) AS sale_date,
                COALESCE(SUM(s.total_payment), 0) AS total
            FROM retailer_ftf_sales s
            WHERE s.retailer_user_id = %s AND {date_sql}
            GROUP BY DATE(CONVERT_TZ(s.created_at, '+00:00', '+08:00'))
            ORDER BY sale_date ASC
            """,
            [user_id, start_date, end_date],
        )
        trend_rows = _rows(cursor)

        cursor.execute(
            f"""
            SELECT
                s.transaction_id, s.reference_no, s.quantity_sold,
                s.total_payment, s.created_at, p.product_name
            FROM retailer_ftf_sales s
            INNER JOIN retailer_products p ON p.product_id = s.retailer_product_id
            WHERE s.retailer_user_id = %s AND {date_sql}
            ORDER BY s.created_at DESC, s.transaction_id DESC
            LIMIT 6
            """,
            [user_id, start_date, end_date],
        )
        sales_rows = _rows(cursor)

        cursor.execute(
            """
            SELECT product_id, product_name, product_code, stock_quantity
            FROM retailer_products
            WHERE retailer_user_id = %s
              AND LOWER(TRIM(status)) = 'active'
              AND stock_quantity < 200
            ORDER BY CASE WHEN stock_quantity = 0 THEN 0 ELSE 1 END,
                     stock_quantity ASC, product_name ASC
            LIMIT 6
            """,
            [user_id],
        )
        stock_rows = _rows(cursor)

    trend_by_date = {str(row["sale_date"]): _money(row["total"]) for row in trend_rows}
    trend = [
        {
            "label": day.strftime("%b %d") if (end_date - start_date).days > 6 else day.strftime("%a"),
            "date": day.isoformat(),
            "value": trend_by_date.get(day.isoformat(), 0),
        }
        for day in (start_date + timedelta(days=index) for index in range((end_date - start_date).days + 1))
    ]

    stock_attention = [
        {
            "id": row["product_id"],
            "name": row["product_name"],
            "product_code": row["product_code"],
            "quantity_kg": float(row["stock_quantity"] or 0),
            "status": "Out of Stock" if float(row["stock_quantity"] or 0) == 0 else "Low Stock",
        }
        for row in stock_rows
    ]
    recent_activity = [
        {
            "id": row["transaction_id"],
            "title": "Completed in-store sale",
            "description": f"{row['product_name']} • {row['reference_no']}",
            "amount": _money(row["total_payment"]),
            "time": _date(row["created_at"]),
        }
        for row in sales_rows
    ]

    return Response(
        {
            "success": True,
            "data": {
                "period": period,
                "start_date": start_date.isoformat(),
                "end_date": end_date.isoformat(),
                "kpis": {
                    "sales_today": sales_today,
                    "low_stock_products": int(inventory[2] or 0),
                    "active_orders": 0,
                    "open_returns": 0,
                },
                "sales_trend": trend,
                "inventory_status": {
                    "total": int(inventory[0] or 0),
                    "in_stock": int(inventory[1] or 0),
                    "low_stock": int(inventory[2] or 0),
                    "no_stock": int(inventory[3] or 0),
                },
                "active_orders": [],
                "stock_attention": stock_attention,
                "pending_actions": [
                    {
                        "id": "inventory",
                        "category": "Inventory",
                        "name": f"{len(stock_attention)} products need attention",
                        "date": "Review inventory",
                        "detailsLabel": "View Inventory",
                    }
                ]
                if stock_attention
                else [],
                "recent_activity": recent_activity,
                "capabilities": {
                    "orders": False,
                    "returns": False,
                    "receiving": False,
                    "messages_unread": False,
                },
            },
        }
    )
