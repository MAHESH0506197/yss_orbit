# yss_orbit\backend\apps\dashboard\urls.py
from django.urls import path
from .views import DashboardListView, DashboardDetailView, DashboardWidgetView, WidgetDataView

app_name = "dashboard"

urlpatterns = [
    path("", DashboardListView.as_view(), name="dashboard-list"),
    path("<str:pk>/", DashboardDetailView.as_view(), name="dashboard-detail"),
    path("<str:dashboard_pk>/widgets/", DashboardWidgetView.as_view(), name="dashboard-widgets"),
    path("widgets/<str:widget_pk>/data/", WidgetDataView.as_view(), name="widget-data"),
]
