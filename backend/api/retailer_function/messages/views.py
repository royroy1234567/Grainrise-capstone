import logging

from django.db import connection
from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response

from api.retailer_function.retailer_auth import retailer_required
from api.farmer_function.messages.selectors import (
    get_farmer_conversation,
    list_farmer_message_threads,
)
from api.farmer_function.messages.services import send_farmer_message

logger = logging.getLogger(__name__)


def _has_existing_conversation(retailer_user_id, participant_type, participant_id):
    try:
        participant_id = int(participant_id)
    except (TypeError, ValueError):
        return False

    if participant_type == "supplier":
        target_sql = """
            SELECT 1 FROM supplier_profiles sp
            JOIN users u ON u.user_id = sp.user_id
            WHERE sp.supplier_profile_id = %s AND u.status = 'active'
        """
        history_sql = """
            SELECT 1 FROM messages
            WHERE (sender_user_id = %s AND receiver_supplier_profile_id = %s)
               OR (receiver_user_id = %s AND sender_supplier_profile_id = %s)
            LIMIT 1
        """
    elif participant_type == "warehouse":
        target_sql = """
            SELECT 1 FROM warehouse_profiles wp
            JOIN users u ON u.user_id = wp.user_id
            WHERE wp.warehouse_profile_id = %s AND u.status = 'active'
        """
        history_sql = """
            SELECT 1 FROM messages
            WHERE (sender_user_id = %s AND receiver_warehouse_profile_id = %s)
               OR (receiver_user_id = %s AND sender_warehouse_profile_id = %s)
            LIMIT 1
        """
    elif participant_type == "user":
        target_sql = "SELECT 1 FROM users WHERE user_id = %s AND status = 'active'"
        history_sql = """
            SELECT 1 FROM messages
            WHERE (sender_user_id = %s AND receiver_user_id = %s)
               OR (receiver_user_id = %s AND sender_user_id = %s)
            LIMIT 1
        """
    else:
        return False

    with connection.cursor() as cursor:
        cursor.execute(target_sql, [participant_id])
        if not cursor.fetchone():
            return False
        cursor.execute(
            history_sql,
            [retailer_user_id, participant_id, retailer_user_id, participant_id],
        )
        return cursor.fetchone() is not None


@api_view(["GET"])
@retailer_required
def message_threads_view(request):
    try:
        threads = list_farmer_message_threads(
            request.retailer_user_id,
            search=str(request.query_params.get("search") or ""),
        )
        return Response({"success": True, "count": len(threads), "data": threads})
    except Exception as exc:
        logger.exception("Failed to list retailer message threads: %s", exc)
        return Response(
            {"success": False, "message": "Failed to load conversations."},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@api_view(["GET"])
@retailer_required
def message_conversation_view(request):
    thread_id = request.query_params.get("thread_id")
    participant_type = request.query_params.get("participant_type")
    participant_id = request.query_params.get("participant_id")
    if not thread_id and (not participant_type or not participant_id):
        return Response(
            {"success": False, "message": "thread_id or participant details are required."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        data = get_farmer_conversation(
            request.retailer_user_id,
            thread_id=thread_id,
            participant_type=participant_type,
            participant_id=participant_id,
        )
        if data is None:
            return Response(
                {"success": False, "message": "Conversation participant was not found."},
                status=status.HTTP_404_NOT_FOUND,
            )
        return Response({"success": True, "data": data})
    except Exception as exc:
        logger.exception("Failed to retrieve retailer conversation: %s", exc)
        return Response(
            {"success": False, "message": "Failed to load conversation messages."},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@api_view(["POST"])
@retailer_required
def send_message_view(request):
    try:
        participant_type = request.data.get("participant_type")
        participant_id = request.data.get("participant_id")
        if not participant_id and request.data.get("thread_id"):
            parts = str(request.data["thread_id"]).split("_", 1)
            if len(parts) == 2:
                participant_type, participant_id = parts
        if not _has_existing_conversation(
            request.retailer_user_id,
            participant_type,
            participant_id,
        ):
            return Response(
                {
                    "success": False,
                    "message": "This conversation is unavailable or has no message history.",
                },
                status=status.HTTP_403_FORBIDDEN,
            )
        new_message = send_farmer_message(request.retailer_user_id, request.data)
        if isinstance(new_message, dict) and new_message.get("blocked"):
            return Response(new_message, status=status.HTTP_400_BAD_REQUEST)
        if isinstance(new_message, dict):
            new_message["sender_type"] = "retailer"
        return Response(
            {
                "success": True,
                "message": "Message sent successfully.",
                "data": new_message,
            },
            status=status.HTTP_201_CREATED,
        )
    except ValueError as exc:
        return Response({"success": False, "message": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
    except Exception as exc:
        logger.exception("Failed to send retailer message: %s", exc)
        return Response(
            {"success": False, "message": "Failed to send message. Please try again."},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )
