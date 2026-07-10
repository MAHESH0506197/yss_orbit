# yss_orbit\backend\apps\tenant_settings\api\serializers\tenant_settings_serializer.py
from rest_framework import serializers
from apps.tenancy.models import TenantSetting

class TenantSettingSerializer(serializers.ModelSerializer):
    class Meta:
        model = TenantSetting
        fields = ['id', 'key', 'value', 'value_type', 'description', 'is_public', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']

class TenantSettingCreateUpdateSerializer(serializers.Serializer):
    key = serializers.CharField(max_length=255)
    value = serializers.CharField()
    value_type = serializers.ChoiceField(choices=TenantSetting.ValueType.choices, default=TenantSetting.ValueType.STRING)
    description = serializers.CharField(required=False, allow_blank=True, default="")
    is_public = serializers.BooleanField(default=False)
