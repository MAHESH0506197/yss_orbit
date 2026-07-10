# yss_orbit\backend\apps\observability\api\serializers\observability_serializer.py
from rest_framework import serializers
from apps.observability.models.metrics_model import SystemMetric
from apps.observability.models.observability_model import RequestTrace

class SystemMetricSerializer(serializers.ModelSerializer):
    class Meta:
        model = SystemMetric
        fields = '__all__'

class RequestTraceSerializer(serializers.ModelSerializer):
    class Meta:
        model = RequestTrace
        fields = '__all__'
