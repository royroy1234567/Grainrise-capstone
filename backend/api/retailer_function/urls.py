from django.urls import include, path
from . import views
from . import pos
from . import history
from . import dashboard

urlpatterns = [
    path("dashboard/", dashboard.dashboard, name="retailer-dashboard"),
    path("messages/", include("api.retailer_function.messages.urls")),
    path("pos/products/", pos.pos_products, name="retailer-pos-products"),
    path("pos/check-reference/", pos.pos_check_reference, name="retailer-pos-check-reference"),
    path("pos/checkout/", pos.pos_checkout, name="retailer-pos-checkout"),
    path("sales-history/", history.history_list, name="retailer-sales-history"),
    path("sales-history/<str:reference_no>/", history.history_detail, name="retailer-sales-history-detail"),
    path("inventory/", views.inventory_collection, name="retailer-inventory"),
    path("inventory/<int:product_id>/", views.inventory_detail, name="retailer-inventory-detail"),
    path("inventory/<int:product_id>/archive/", views.archive_inventory, name="retailer-inventory-archive"),
    path("inventory/<int:product_id>/restore/", views.restore_inventory, name="retailer-inventory-restore"),
]
