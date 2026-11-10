from datetime import datetime
from decimal import Decimal
from zoneinfo import ZoneInfo

from django.db import connection
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_GET

from .retailer_auth import retailer_required

PH_TZ = ZoneInfo("Asia/Manila")


def _local_datetime(value):
    if value is None:
        return None
    if getattr(value, "tzinfo", None) is None:
        return value.replace(tzinfo=ZoneInfo("UTC")).astimezone(PH_TZ)
    return value.astimezone(PH_TZ)


def _money(value):
    return float(Decimal(str(value or "0")).quantize(Decimal("0.01")))


def _query_rows(user_id, search, start_date, end_date, sort):
    clauses = ["s.retailer_user_id = %s"]
    params = [user_id]
    if start_date:
        clauses.append("DATE(CONVERT_TZ(s.created_at, '+00:00', '+08:00')) >= %s")
        params.append(start_date)
    if end_date:
        clauses.append("DATE(CONVERT_TZ(s.created_at, '+00:00', '+08:00')) <= %s")
        params.append(end_date)
    if search:
        clauses.append(
            "(LOWER(s.reference_no) LIKE %s OR LOWER(p.product_name) LIKE %s "
            "OR LOWER(p.product_code) LIKE %s OR CAST(s.total_payment AS CHAR) LIKE %s)"
        )
        value = f"%{search.lower()}%"
        params.extend([value, value, value, value])
    order = "ASC" if sort == "date-asc" else "DESC"
    if sort in {"amount-asc", "amount-desc"}:
        order = "ASC" if sort == "amount-asc" else "DESC"
        order_sql = f"SUM(s.total_payment) {order}, MAX(s.created_at) DESC"
    else:
        order_sql = f"MAX(s.created_at) {order}"
    sql = f"""
        SELECT s.transaction_id, s.reference_no, s.quantity_sold, s.total_payment,
               s.amount_paid, s.change_amount, s.payment_method,
               s.payment_proof_image, s.created_at,
               p.product_id, p.product_name, p.product_code, p.selling_price,
               u.first_name, u.last_name
        FROM retailer_ftf_sales s
        INNER JOIN retailer_products p ON p.product_id = s.retailer_product_id
        INNER JOIN users u ON u.user_id = s.retailer_user_id
        WHERE {' AND '.join(clauses)}
        GROUP BY s.transaction_id, s.reference_no, s.quantity_sold,
                 s.total_payment, s.amount_paid, s.change_amount,
                 s.payment_method, s.payment_proof_image, s.created_at,
                 p.product_id, p.product_name, p.product_code, p.selling_price,
                 u.first_name, u.last_name
        ORDER BY {order_sql}
    """
    with connection.cursor() as cursor:
        cursor.execute(sql, params)
        columns = [column[0] for column in cursor.description]
        return [dict(zip(columns, row)) for row in cursor.fetchall()]


def _group(rows):
    groups = {}
    for row in rows:
        reference = row["reference_no"]
        group = groups.setdefault(reference, {
            "id": reference,
            "reference_no": reference,
            "created_at": row["created_at"],
            "amount_paid": row["amount_paid"],
            "change_amount": row["change_amount"],
            "payment_method": row["payment_method"],
            "payment_proof_image": row["payment_proof_image"],
            "seller_name": f"{row['first_name'] or ''} {row['last_name'] or ''}".strip(),
            "items": [],
            "total_amount": Decimal("0"),
            "total_quantity_kg": Decimal("0"),
        })
        quantity = Decimal(str(row["quantity_sold"] or "0"))
        subtotal = Decimal(str(row["total_payment"] or "0"))
        group["items"].append({
            "transaction_id": row["transaction_id"],
            "product_name": row["product_name"],
            "product_code": row["product_code"],
            "quantity_kg": float(quantity),
            "quantity_label": f"{quantity:g} kg",
            "unit_price": _money(row["selling_price"]),
            "line_subtotal": _money(subtotal),
        })
        group["total_amount"] += subtotal
        group["total_quantity_kg"] += quantity
    result = []
    for group in groups.values():
        dt = _local_datetime(group["created_at"])
        group["transaction_date"] = dt.isoformat() if dt else None
        group["transaction_date_formatted"] = dt.strftime("%b %d, %Y, %I:%M %p") if dt else "—"
        group["time"] = dt.strftime("%I:%M %p").lstrip("0") if dt else "—"
        group["total_amount"] = _money(group["total_amount"])
        group["total_quantity_kg"] = float(group["total_quantity_kg"])
        group["amount_paid"] = _money(group["amount_paid"])
        group["change_amount"] = _money(group["change_amount"])
        group["payment_method_label"] = (
            "Bank Transfer" if str(group["payment_method"]).lower() in {"bank", "bank_transfer", "bank transfer"}
            else "GCash" if str(group["payment_method"]).lower() == "gcash" else "Cash"
        )
        group["variant"] = group["items"][0]["product_name"] if len(group["items"]) == 1 else f"{len(group['items'])} products"
        group["quantity"] = f"{group['total_quantity_kg']:g} kg"
        result.append(group)
    return result


@csrf_exempt
@require_GET
@retailer_required
def history_list(request):
    search = str(request.GET.get("search") or "").strip()
    start_date = request.GET.get("start_date") or ""
    end_date = request.GET.get("end_date") or ""
    sort = request.GET.get("sort") or "date-desc"
    rows = _query_rows(request.retailer_user_id, search, start_date, end_date, sort)
    groups = _group(rows)
    return JsonResponse({"success": True, "data": groups, "count": len(groups)})


@csrf_exempt
@require_GET
@retailer_required
def history_detail(request, reference_no):
    rows = _query_rows(request.retailer_user_id, reference_no, "", "", "date-asc")
    groups = [group for group in _group(rows) if group["reference_no"] == reference_no]
    if not groups:
        return JsonResponse({"success": False, "message": "Transaction not found."}, status=404)
    receipt = groups[0]
    receipt["business_name"] = "GrainRise Retailer"
    receipt["payment_method"] = str(receipt["payment_method"] or "").lower()
    return JsonResponse({"success": True, "receipt": receipt})
