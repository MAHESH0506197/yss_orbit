# yss_orbit\backend\apps\error_log\serializers.py
from rest_framework import serializers
from apps.compliance.models import ErrorLog

class ErrorLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = ErrorLog
        fields = [
            "id", "message", "exception_type", "traceback", "severity",
            "user_id", "organization_id", "business_unit_id",
            "endpoint", "http_method", "ip_address", "user_agent",
            "request_data", "correlation_id", "resolved",
            "resolved_at", "resolved_by_id", "notes", "created_at",
        ]
        read_only_fields = [
            "id", "message", "exception_type", "traceback", "severity",
            "user_id", "organization_id", "business_unit_id",
            "endpoint", "http_method", "ip_address", "user_agent",
            "request_data", "correlation_id", "created_at",
        ]
