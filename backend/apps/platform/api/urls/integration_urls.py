# yss_orbit\backend\apps\integration\urls.py
from django.urls import path
from apps.platform.api.views.integration_list_view import IntegrationListView
from apps.platform.api.views.integration_detail_view import IntegrationDetailView
from apps.platform.api.views.webhook_view import WebhookListView, WebhookDetailView

urlpatterns = [
    path("integrations/", IntegrationListView.as_view(), name="integration-list"),
    path("integrations/<str:pk>/", IntegrationDetailView.as_view(), name="integration-detail"),
    
    path("webhooks/", WebhookListView.as_view(), name="webhook-list"),
    path("webhooks/<str:pk>/", WebhookDetailView.as_view(), name="webhook-detail"),
]
