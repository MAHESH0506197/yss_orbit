# yss_orbit\backend\apps\webhook\urls.py
from django.urls import path

from apps.platform.webhook_webhook_views import (
    WebhookEndpointListCreateView,
    WebhookEndpointDetailView,
    WebhookDeliveryListView,
    WebhookDeliveryDetailView,
)

app_name = "webhooks"

urlpatterns = [
    path("endpoints/", WebhookEndpointListCreateView.as_view(), name="endpoint-list-create"),
    path("endpoints/<uuid:pk>/", WebhookEndpointDetailView.as_view(), name="endpoint-detail"),
    path("deliveries/", WebhookDeliveryListView.as_view(), name="delivery-list"),
    path("deliveries/<uuid:pk>/", WebhookDeliveryDetailView.as_view(), name="delivery-detail"),
]
