import base64
import json
import os
import re
import uuid
from datetime import datetime, timedelta
from decimal import Decimal, InvalidOperation
from zoneinfo import ZoneInfo

from django.conf import settings
from django.core.files.base import ContentFile
from django.core.files.storage import default_storage
from django.db import connection, transaction
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_GET, require_POST

from .retailer_auth import retailer_required

PH_TZ = ZoneInfo("Asia/Manila")


def _json(request):
    try:
        return json.loads(request.body.decode("utf-8") or "{}")
    except (ValueError, UnicodeDecodeError):
        return None


def _seller(user_id, cursor):
    cursor.execute(
        "SELECT first_name, last_name FROM users WHERE user_id = %s AND user_role = 'retailer' AND status = 'active' LIMIT 1",
        [user_id],
    )
    row = cursor.fetchone()
    return row or ("", "")


def _initials(first_name, last_name):
    letters = lambda value: "".join(c for c in str(value or "") if c.isalpha()).upper()
    first, last = letters(first_name), letters(last_name)
    return f"{first[:1]}{last[:1]}" if first and last else (first[:2] or last[:2] or "SL")


def _prefix(product_name):
    value = "".join(c for c in str(product_name or "") if c.isalpha()).upper()
    return (value + "XXX")[:3]


def _reference(product_name, seller_initials, cursor):
    now = datetime.now(PH_TZ)
    for offset in range(1440):
        candidate_time = now + timedelta(minutes=offset)
        candidate = f"{_prefix(product_name)}-{seller_initials}-{candidate_time:%m%d%Y-%H%M}"
        cursor.execute("SELECT 1 FROM retailer_ftf_sales WHERE reference_no = %s LIMIT 1", [candidate])
        if not cursor.fetchone():
            return candidate
    raise ValueError("Unable to generate a unique transaction reference. Please retry.")


def _save_proof(user_id, reference_no, image_data):
    raw = str(image_data or "").strip()
    if not raw:
        raise ValueError("Payment receipt image is required.")
    _, separator, payload = raw.partition(",")
    encoded = payload if separator else raw
    try:
        content = base64.b64decode(encoded, validate=False)
    except Exception as exc:
        raise ValueError("Invalid payment receipt image.") from exc
    if len(content) < 64 or len(content) > 10 * 1024 * 1024:
        raise ValueError("Payment receipt image is invalid or exceeds 10 MB.")
    safe_ref = re.sub(r"[^A-Za-z0-9_-]", "", reference_no)[:32]
    saved = default_storage.save(
        f"pos_payment_proofs/retailer_{user_id}/{safe_ref}_{uuid.uuid4().hex[:8]}.jpg",
        ContentFile(content),
    )
    return f"{getattr(settings, 'MEDIA_URL', '/media/').rstrip('/')}/{saved.lstrip('/')}"


def _products(user_id, cursor):
    today = datetime.now(PH_TZ).date()
    cursor.execute(
        """
        SELECT product_id, product_code, product_name, product_description,
               product_image, expiry_date, stock_quantity, selling_price
        FROM retailer_products
        WHERE retailer_user_id = %s
          AND LOWER(TRIM(status)) = 'active'
          AND expiry_date IS NOT NULL AND expiry_date > %s
          AND stock_quantity > 0
          AND selling_price IS NOT NULL AND selling_price > 0
        ORDER BY product_name ASC, product_id ASC
        """,
        [user_id, today],
    )
    result = []
    for row in cursor.fetchall():
        stock = Decimal(str(row[6]))
        result.append({
            "id": int(row[0]), "product_id": int(row[0]), "product_code": row[1],
            "sku": row[1], "product_name": row[2], "name": row[2],
            "variant": row[2], "description": row[3] or "", "image": row[4] or "",
            "expiry_date": row[5].isoformat(), "stock_quantity_kg": float(stock),
            "stock_available": float(stock), "selling_price_per_kg": float(row[7]),
            "price": float(row[7]), "unit_label": "Per kg",
            "stock_status": "In Stock" if stock >= 200 else "Low Stock",
        })
    return result


@csrf_exempt
@require_GET
@retailer_required
def pos_products(request):
    with connection.cursor() as cursor:
        products = _products(request.retailer_user_id, cursor)
        first, last = _seller(request.retailer_user_id, cursor)
    return JsonResponse({"products": products, "seller": {
        "first_name": first, "last_name": last,
        "seller_name": f"{first} {last}".strip(),
        "initials": _initials(first, last),
    }})


@csrf_exempt
@require_POST
@retailer_required
def pos_check_reference(request):
    payload = _json(request)
    if payload is None:
        return JsonResponse({"detail": "Invalid JSON body."}, status=400)
    reference = re.sub(r"\s+", "", str(payload.get("reference_no") or "").strip()).upper()
    with connection.cursor() as cursor:
        cursor.execute(
            "SELECT 1 FROM retailer_ftf_sales WHERE UPPER(REPLACE(TRIM(reference_no), ' ', '')) = %s LIMIT 1",
            [reference],
        )
        duplicate = cursor.fetchone() is not None
    return JsonResponse({"is_duplicate": duplicate, "normalized_reference": reference})


@csrf_exempt
@require_POST
@retailer_required
def pos_checkout(request):
    payload = _json(request)
    if payload is None:
        return JsonResponse({"detail": "Invalid JSON request body."}, status=400)
    items = payload.get("items") or []
    method = str(payload.get("payment_method") or "").strip()
    idem = str(payload.get("idempotency_key") or request.headers.get("X-Idempotency-Key") or "").strip()
    if not items or method not in {"Cash", "GCash", "Bank Transfer"} or not idem:
        return JsonResponse({"detail": "Cart, payment method, and idempotency key are required."}, status=400)
    try:
        with transaction.atomic():
            with connection.cursor() as cursor:
                cursor.execute(
                    "SELECT reference_no FROM retailer_ftf_sales WHERE retailer_user_id = %s AND idempotency_key = %s LIMIT 1",
                    [request.retailer_user_id, idem],
                )
                existing = cursor.fetchone()
                if existing:
                    return JsonResponse({"message": "Transaction already completed.", "reference_no": existing[0]}, status=200)

                first_name, last_name = _seller(request.retailer_user_id, cursor)
                normalized = []
                total = Decimal("0")
                for item in items:
                    product_id = int(item.get("product_id") or item.get("id"))
                    quantity = Decimal(str(item.get("quantity") or "0"))
                    if quantity <= 0:
                        raise ValueError("Quantity must be greater than zero.")
                    cursor.execute(
                        """SELECT product_id, product_name, stock_quantity, selling_price
                           FROM retailer_products
                           WHERE product_id = %s AND retailer_user_id = %s
                             AND LOWER(TRIM(status)) = 'active'
                             AND expiry_date > %s
                           FOR UPDATE""",
                        [product_id, request.retailer_user_id, datetime.now(PH_TZ).date()],
                    )
                    row = cursor.fetchone()
                    if not row:
                        raise ValueError("A cart product is no longer available.")
                    available, price = Decimal(str(row[2])), Decimal(str(row[3] or "0"))
                    if price <= 0 or quantity > available:
                        raise ValueError(f"Insufficient stock for {row[1]}.")
                    normalized.append((row[0], row[1], quantity, price))
                    total += quantity * price
                try:
                    paid = Decimal(str(payload.get("amount_paid") or "0"))
                except InvalidOperation as exc:
                    raise ValueError("Amount paid is invalid.") from exc
                proof = payload.get("payment_proof_image")
                reference = str(payload.get("reference_no") or "").strip().upper()
                if method == "Cash":
                    if paid < total:
                        raise ValueError("Amount paid is insufficient.")
                    reference = _reference(normalized[0][1], _initials(first_name, last_name), cursor)
                    proof_url = None
                else:
                    if not reference or not proof:
                        raise ValueError("A payment reference and receipt image are required.")
                    cursor.execute("SELECT 1 FROM retailer_ftf_sales WHERE reference_no = %s LIMIT 1", [reference])
                    if cursor.fetchone():
                        raise ValueError("This payment reference has already been used.")
                    proof_url = _save_proof(request.retailer_user_id, reference, proof)
                change = paid - total if method == "Cash" else Decimal("0")
                for product_id, name, quantity, price in normalized:
                    cursor.execute(
                        """INSERT INTO retailer_ftf_sales
                           (retailer_user_id, retailer_product_id, quantity_sold,
                            total_payment, amount_paid, change_amount, payment_method,
                            reference_no, payment_proof_image, idempotency_key)
                           VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)""",
                        [request.retailer_user_id, product_id, quantity, quantity * price,
                         paid, change, method, reference, proof_url, idem],
                    )
                    cursor.execute(
                        "UPDATE retailer_products SET stock_quantity = stock_quantity - %s WHERE product_id = %s AND retailer_user_id = %s AND stock_quantity >= %s",
                        [quantity, product_id, request.retailer_user_id, quantity],
                    )
                    if cursor.rowcount != 1:
                        raise ValueError(f"Stock changed while selling {name}. Please retry.")
                return JsonResponse({
                    "message": "Transaction completed successfully.",
                    "receipt": {"reference_no": reference, "total": float(total),
                                "amount_paid": float(paid), "change": float(change),
                                "payment_method": method, "seller": f"{first_name} {last_name}".strip(),
                                "items": [{"product_name": n, "quantity_kg": float(q), "unit_price": float(p), "subtotal": float(q * p)} for _, n, q, p in normalized]},
                }, status=201)
    except (ValueError, InvalidOperation) as exc:
        return JsonResponse({"detail": str(exc)}, status=400)
    except Exception as exc:
        return JsonResponse({"detail": "Unable to complete transaction.", "error": str(exc)}, status=500)

