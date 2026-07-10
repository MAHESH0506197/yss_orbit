# yss_orbit\backend\apps\health\api\serializers\health_response_serializer.py
from rest_framework import serializers

class SystemStatusResponseSerializer(serializers.Serializer):
    status = serializers.CharField()
    version = serializers.CharField()
    database = serializers.CharField()
    cache = serializers.CharField()
    worker = serializers.CharField()
    timestamp = serializers.DateTimeField()
