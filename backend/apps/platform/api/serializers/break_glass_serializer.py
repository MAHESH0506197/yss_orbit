# yss_orbit\backend\apps\platform_admin\api\serializers\break_glass_serializer.py
from rest_framework import serializers

class BreakGlassSerializer(serializers.Serializer):
    """
    Serializer for the Break-Glass emergency access endpoint.
    Used by super-admins to temporarily bypass strict multi-tenant isolation during incidents.
    """
    reason = serializers.CharField(required=True, help_text="Mandatory incident ticket or reason for break-glass access.")
    target_tenant_id = serializers.IntegerField(required=True)
    duration_minutes = serializers.IntegerField(default=60)
