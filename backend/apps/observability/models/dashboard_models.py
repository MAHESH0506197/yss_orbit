# yss_orbit\backend\apps\dashboard\models.py
from django.db import models
from apps.platform.models.base import TenantModel

class Dashboard(TenantModel):
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    is_default = models.BooleanField(default=False, help_text="Is this the default dashboard for the business unit?")
    layout_type = models.CharField(max_length=50, default="GRID")

    class Meta(TenantModel.Meta):
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return self.name

class DashboardWidget(TenantModel):
    class WidgetType(models.TextChoices):
        KPI = "KPI", "Key Performance Indicator"
        LINE_CHART = "LINE_CHART", "Line Chart"
        BAR_CHART = "BAR_CHART", "Bar Chart"
        PIE_CHART = "PIE_CHART", "Pie Chart"
        TABLE = "TABLE", "Data Table"

    dashboard = models.ForeignKey(Dashboard, on_delete=models.CASCADE, related_name="widgets")
    title = models.CharField(max_length=255)
    widget_type = models.CharField(max_length=20, choices=WidgetType.choices, default=WidgetType.KPI)
    
    # Layout (e.g., for react-grid-layout)
    position_x = models.IntegerField(default=0)
    position_y = models.IntegerField(default=0)
    width = models.IntegerField(default=2)
    height = models.IntegerField(default=2)
    
    # Configuration and Data Source
    metric_name = models.CharField(max_length=100, help_text="Internal name of the metric/KPI to fetch")
    config = models.JSONField(default=dict, blank=True, help_text="Additional configuration like colors, filters, etc.")
    
    refresh_interval_seconds = models.IntegerField(default=300, help_text="How often the widget should auto-refresh")

    class Meta(TenantModel.Meta):
        ordering = ["dashboard", "position_y", "position_x"]

    def __str__(self) -> str:
        return f"{self.title} ({self.widget_type})"
