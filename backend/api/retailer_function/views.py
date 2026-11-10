from datetime import date
from django.utils import timezone

from django.db import connection, transaction
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status

from .retailer_auth import retailer_required


def _rows(cursor):
    names = [col[0] for col in cursor.description]
    return [dict(zip(names, row)) for row in cursor.fetchall()]


def _format(row):
    if not row:
        return None
    row["id"] = row["product_id"]
    row["stock_quantity"] = float(row["stock_quantity"] or 0)
    for key in ("unit_cost", "selling_price"):
        row[key] = float(row[key]) if row[key] is not None else None
    for key in ("order_date", "arrival_date", "expiry_date"):
        row[key] = str(row[key]) if row[key] else None
    row["is_archived"] = str(row["status"]).lower() == "archived"
    row["stock_status"] = "In Stock" if row["stock_quantity"] >= 200 else ("Low Stock" if row["stock_quantity"] > 0 else "Out of Stock")
    return row


SELECT = """
SELECT rp.product_id, rp.product_code, rp.product_name,
       rp.product_name AS variant,
       rp.product_image, rp.stock_quantity, rp.unit_cost, rp.selling_price,
       rp.order_date, rp.arrival_date, rp.expiry_date, rp.product_description,
       rp.archive_reason, rp.status, rp.miller_online_receiving_id,
       rp.warehouse_online_receiving_id,
       CASE
           WHEN rp.miller_online_receiving_id IS NOT NULL THEN 'miller'
           WHEN rp.warehouse_online_receiving_id IS NOT NULL THEN 'warehouse'
           ELSE 'nongrainrise'
       END AS source_type,
       rp.nongrainrise_supplier_name,
       NULL AS miller_supplier_name,
       NULL AS warehouse_supplier_name
FROM retailer_products rp
WHERE rp.retailer_user_id = %s
"""


def _generate_product_code(product_name, cursor):
    clean_name = str(product_name or "").strip()
    letters = [char.upper() for char in clean_name if char.isalpha()]
    suffix = "".join(letters[:3]).ljust(3, "X") if letters else "PRD"
    base = f"ADD - {timezone.localtime(timezone.now()):%m%d%Y-%H%M}-{suffix}"
    code = base
    counter = 1
    while True:
        cursor.execute("SELECT 1 FROM retailer_products WHERE product_code = %s LIMIT 1", [code])
        if not cursor.fetchone():
            return code
        counter += 1
        code = f"{base}-{counter}"


@api_view(["GET", "POST"])
@retailer_required
def inventory_collection(request):
    if request.method == "GET":
        archived = request.query_params.get("status", "active").lower() == "archived"
        sql = SELECT + " AND rp.status = %s ORDER BY rp.product_name ASC, rp.product_id DESC"
        with connection.cursor() as cursor:
            cursor.execute(sql, [request.retailer_user_id, "archived" if archived else "active"])
            products = [_format(row) for row in _rows(cursor)]
        return Response({"success": True, "data": products})

    data = request.data
    required = ("product_name", "nongrainrise_supplier_name", "stock_quantity", "unit_cost", "selling_price", "arrival_date", "expiry_date")
    if any(not str(data.get(field, "")).strip() for field in required):
        return Response({"success": False, "message": "All required product fields must be provided."}, status=status.HTTP_400_BAD_REQUEST)
    try:
        quantity = float(data["stock_quantity"])
        unit_cost = float(data["unit_cost"])
        selling_price = float(data["selling_price"])
        if quantity < 0 or unit_cost < 0 or selling_price < 0:
            raise ValueError
        date.fromisoformat(str(data["arrival_date"]))
        date.fromisoformat(str(data["expiry_date"]))
    except (TypeError, ValueError):
        return Response({"success": False, "message": "Quantity, prices, and dates are invalid."}, status=status.HTTP_400_BAD_REQUEST)
    with transaction.atomic():
        with connection.cursor() as cursor:
            product_code = _generate_product_code(data["product_name"], cursor)
            cursor.execute(
                """INSERT INTO retailer_products
                (retailer_user_id, product_code, product_name,
                 nongrainrise_supplier_name, product_image, stock_quantity,
                 unit_cost, selling_price, order_date, arrival_date, expiry_date,
                 product_description, status)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, 'active')""",
                [request.retailer_user_id, product_code, data["product_name"],
                 data["nongrainrise_supplier_name"], data.get("product_image"),
                 quantity, unit_cost, selling_price, data.get("order_date"),
                 data["arrival_date"], data["expiry_date"], data.get("product_description", "")],
            )
            product_id = cursor.lastrowid
    return Response({"success": True, "data": {"id": product_id}}, status=status.HTTP_201_CREATED)


@api_view(["GET", "PATCH", "DELETE"])
@retailer_required
def inventory_detail(request, product_id):
    with connection.cursor() as cursor:
        cursor.execute(SELECT + " AND rp.product_id = %s LIMIT 1", [request.retailer_user_id, product_id])
        row = cursor.fetchone()
        product = _format(row and dict(zip([c[0] for c in cursor.description], row)))
    if not product:
        return Response({"success": False, "message": "Product not found."}, status=404)
    if request.method == "GET":
        return Response({"success": True, "data": product})
    if request.method == "DELETE":
        with connection.cursor() as cursor:
            cursor.execute("DELETE FROM retailer_products WHERE product_id = %s AND retailer_user_id = %s AND status = 'archived'", [product_id, request.retailer_user_id])
        return Response({"success": True})
    allowed = {"product_description", "selling_price"} if str(product["source_type"]).lower() in {"miller", "warehouse", "registered"} else {
        "product_name", "variant", "nongrainrise_supplier_name", "product_image", "stock_quantity",
        "unit_cost", "selling_price", "order_date", "arrival_date", "expiry_date", "product_description",
    }
    changes = {
        ("product_name" if key == "variant" else key): value
        for key, value in request.data.items()
        if key in allowed
    }
    if not changes:
        return Response({"success": False, "message": "No permitted changes supplied."}, status=400)
    if "stock_quantity" in changes and float(changes["stock_quantity"]) < 0:
        return Response({"success": False, "message": "Stock quantity cannot be negative."}, status=400)
    with connection.cursor() as cursor:
        assignments = ", ".join(f"{key} = %s" for key in changes)
        cursor.execute(f"UPDATE retailer_products SET {assignments} WHERE product_id = %s AND retailer_user_id = %s", [*changes.values(), product_id, request.retailer_user_id])
    return Response({"success": True})


@api_view(["POST"])
@retailer_required
def archive_inventory(request, product_id):
    reason = str(request.data.get("reason", "")).strip()
    if not reason or len(reason) > 500:
        return Response({"success": False, "message": "A valid archive reason is required."}, status=400)
    with connection.cursor() as cursor:
        cursor.execute("UPDATE retailer_products SET status = 'archived', archive_reason = %s WHERE product_id = %s AND retailer_user_id = %s AND status = 'active'", [reason, product_id, request.retailer_user_id])
        if cursor.rowcount != 1:
            return Response({"success": False, "message": "Active product not found."}, status=404)
    return Response({"success": True})


@api_view(["POST"])
@retailer_required
def restore_inventory(request, product_id):
    with connection.cursor() as cursor:
        cursor.execute("UPDATE retailer_products SET status = 'active', archive_reason = NULL WHERE product_id = %s AND retailer_user_id = %s AND status = 'archived'", [product_id, request.retailer_user_id])
        if cursor.rowcount != 1:
            return Response({"success": False, "message": "Archived product not found."}, status=404)
    return Response({"success": True})
