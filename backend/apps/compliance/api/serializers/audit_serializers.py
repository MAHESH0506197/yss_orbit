# yss_orbit\backend\apps\audit\serializers.py
import logging
from typing import Any, Optional

from rest_framework import serializers
from rest_framework.request import Request

from apps.compliance.models import AuditLog


logger = logging.getLogger(__name__)


class AuditLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = AuditLog
        fields = [
            "id", "user_id", "user_username", "is_impersonated", "impersonated_by_id",
            "organization_id", "business_unit_id", "action", "resource_type",
            "resource_id", "resource_display", "old_values", "new_values",
            "correlation_id", "request_id", "ip_address", "user_agent",
            "endpoint", "http_method", "extra", "created_at", "chain_hash",
        ]
        read_only_fields = fields
