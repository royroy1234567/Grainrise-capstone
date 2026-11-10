from django.urls import path

from .views import message_conversation_view, message_threads_view, send_message_view

urlpatterns = [
    path("threads/", message_threads_view, name="retailer-message-threads"),
    path("conversation/", message_conversation_view, name="retailer-message-conversation"),
    path("send/", send_message_view, name="retailer-send-message"),
]
