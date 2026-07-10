# yss_orbit\backend\apps\dashboard\api\serializers\dashboard_response_serializer.py
from rest_framework import serializers

class DashboardSummaryResponseSerializer(serializers.Serializer):
    id = serializers.UUIDField()
    name = serializers.CharField()
    widget_count = serializers.IntegerField()
