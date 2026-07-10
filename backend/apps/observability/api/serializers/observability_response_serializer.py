# yss_orbit\backend\apps\observability\api\serializers\observability_response_serializer.py
from rest_framework import serializers

class ObservabilityResponseSerializer(serializers.Serializer):
    """
    Standardized response format for Observability metrics/traces.
    """
    status = serializers.CharField(default='success')
    message = serializers.CharField()
    data = serializers.DictField()
