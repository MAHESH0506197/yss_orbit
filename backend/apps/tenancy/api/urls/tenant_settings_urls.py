# yss_orbit\backend\apps\tenant_settings\urls.py
from django.urls import path
from rest_framework.routers import DefaultRouter

app_name = 'tenant_settings'
router = DefaultRouter()

urlpatterns = [
    # path('api/v1/tenant_settings/', views.ListCreateAPIView.as_view(), name='list'),
] + router.urls
