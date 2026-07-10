# yss_orbit\backend\apps\reporting\urls.py
from django.urls import path
from .reporting_views import DashboardKPIView, SalesTrendView, ReportTemplateListView, ReportExecutionView

app_name = "reporting"

urlpatterns = [
    path("kpis/", DashboardKPIView.as_view(), name="dashboard-kpis"),
    path("trends/sales/", SalesTrendView.as_view(), name="sales-trends"),
    path("templates/", ReportTemplateListView.as_view(), name="report-templates"),
    path("templates/<str:template_pk>/executions/", ReportExecutionView.as_view(), name="report-executions"),
]
