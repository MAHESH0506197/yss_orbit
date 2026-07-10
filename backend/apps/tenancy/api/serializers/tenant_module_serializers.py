from rest_framework import serializers
from apps.tenancy.models import TenantModule

class TenantModuleSerializer(serializers.ModelSerializer):
    class Meta:
        model = TenantModule
        fields = [
            'id', 'business_unit_id', 'module_code', 'status', 'plan', 
            'created_at', 'updated_at',
            'created_reason', 'updated_reason', 'deleted_reason', 'restored_reason',
            'reason'
        ]
        read_only_fields = [
            'id', 'business_unit_id', 'created_at', 'updated_at',
            'created_reason', 'updated_reason', 'deleted_reason', 'restored_reason'
        ]

    reason = serializers.CharField(write_only=True, required=False, allow_blank=True)
