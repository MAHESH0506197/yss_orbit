# DEPRECATED - DO NOT USE. Scheduled for removal. Use apps.hrms instead.
# yss_orbit\backend\apps\hrms_core\api\serializers\designation_serializer.py
from rest_framework import serializers

class DesignationSerializer(serializers.Serializer):
    """
    Serializer for Designation.
    """
    id = serializers.UUIDField(read_only=True)
    created_at = serializers.DateTimeField(read_only=True)
    updated_at = serializers.DateTimeField(read_only=True)
