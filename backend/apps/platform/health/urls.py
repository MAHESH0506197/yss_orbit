# yss_orbit\backend\apps\platform\health\urls.py
from django.urls import path
from apps.platform.health.platform_health_dashboard import (
    InfrastructureHealthView,
    PlatformHealthDashboardView,
)

urlpatterns = [
    path("infrastructure/", InfrastructureHealthView.as_view(), name="platform-health-infra"),
    path("dashboard/", PlatformHealthDashboardView.as_view(), name="platform-health-dashboard"),
]
