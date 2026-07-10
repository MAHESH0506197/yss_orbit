# yss_orbit\backend\apps\api_consumer_key\urls.py
from django.urls import path, include
from apps.platform.api_consumer_key_views import APIKeyListView, APIKeyDetailView

urlpatterns = [
    path("", APIKeyListView.as_view(), name="api-key-list"),
    path("<str:key_id>/", APIKeyDetailView.as_view(), name="api-key-detail"),
]
