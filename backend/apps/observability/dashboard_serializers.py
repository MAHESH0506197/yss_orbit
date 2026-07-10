# yss_orbit\backend\apps\dashboard\serializers.py
from rest_framework import serializers
from .models import Dashboard, DashboardWidget

class DashboardWidgetSerializer(serializers.ModelSerializer):
    class Meta:
        model = DashboardWidget
        fields = [
            "id", "title", "widget_type", "position_x", "position_y", 
            "width", "height", "metric_name", "config", "refresh_interval_seconds",
            "created_at", "updated_at"
        ]
        read_only_fields = ["id", "created_at", "updated_at"]

class DashboardSerializer(serializers.ModelSerializer):
    widgets = DashboardWidgetSerializer(many=True, read_only=True)
    
    class Meta:
        model = Dashboard
        fields = ["id", "name", "description", "is_default", "layout_type", "widgets", "created_at", "updated_at"]
        read_only_fields = ["id", "created_at", "updated_at"]
