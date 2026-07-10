from django.urls import path
from ..views.dashboard_view import PlatformDashboardView
from ..views.context_view import PlatformContextView

urlpatterns = [
    path('dashboard/', PlatformDashboardView.as_view(), name='platform-dashboard'),
    path('context/', PlatformContextView.as_view(), name='platform-context'),
]
