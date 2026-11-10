from functools import wraps

from django.db import connection
from django.http import JsonResponse

from api.utils import authorization_payload


def retailer_required(view_func):
    @wraps(view_func)
    def wrapped(request, *args, **kwargs):
        payload = authorization_payload(request)
        if not payload or (payload.get("role") and payload["role"] != "retailer"):
            return JsonResponse({"success": False, "message": "Retailer authentication required."}, status=401)
        try:
            user_id = int(payload.get("sub"))
        except (TypeError, ValueError):
            return JsonResponse({"success": False, "message": "Invalid retailer identity."}, status=401)
        with connection.cursor() as cursor:
            cursor.execute(
                "SELECT user_id FROM users WHERE user_id = %s AND user_role = 'retailer' AND status = 'active' LIMIT 1",
                [user_id],
            )
            if not cursor.fetchone():
                return JsonResponse({"success": False, "message": "Retailer account is not active."}, status=403)
        request.retailer_user_id = user_id
        return view_func(request, *args, **kwargs)
    return wrapped

