# yss_orbit\backend\apps\dashboard\api\serializers\dashboard_serializer.py
from rest_framework import serializers
from apps.observability.models import Dashboard, DashboardWidget

class DashboardWidgetSerializer(serializers.ModelSerializer):
    class Meta:
        model = DashboardWidget
        fields = '__all__'

class DashboardSerializer(serializers.ModelSerializer):
    widgets = DashboardWidgetSerializer(many=True, read_only=True)

    class Meta:
        model = Dashboard
        fields = '__all__'
