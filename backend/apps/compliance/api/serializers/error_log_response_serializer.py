# yss_orbit\backend\apps\error_log\api\serializers\error_log_response_serializer.py
from rest_framework import serializers

class ErrorLogResponseSerializer(serializers.Serializer):
    id = serializers.UUIDField(read_only=True)
    created_at = serializers.DateTimeField(read_only=True)
