# yss_orbit\backend\apps\dashboard\admin.py
from django.contrib import admin
from .models import Dashboard, DashboardWidget

@admin.register(Dashboard)
class DashboardAdmin(admin.ModelAdmin):
    list_display = ('name', 'is_default', 'layout_type', 'created_at', 'updated_at')
    search_fields = ('name', 'description')
    list_filter = ('is_default', 'layout_type', 'created_at')

@admin.register(DashboardWidget)
class DashboardWidgetAdmin(admin.ModelAdmin):
    list_display = ('title', 'dashboard', 'widget_type', 'metric_name', 'position_x', 'position_y')
    search_fields = ('title', 'metric_name')
    list_filter = ('widget_type', 'dashboard')