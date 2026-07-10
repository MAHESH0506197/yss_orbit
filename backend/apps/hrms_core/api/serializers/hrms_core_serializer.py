# DEPRECATED - DO NOT USE. Scheduled for removal. Use apps.hrms instead.
# yss_orbit\backend\apps\hrms_core\api\serializers\hrms_core_serializer.py
from rest_framework import serializers

class HrmsCoreSerializer(serializers.Serializer):
    """
    Serializer for HrmsCore.
    """
    id = serializers.UUIDField(read_only=True)
    created_at = serializers.DateTimeField(read_only=True)
    updated_at = serializers.DateTimeField(read_only=True)
