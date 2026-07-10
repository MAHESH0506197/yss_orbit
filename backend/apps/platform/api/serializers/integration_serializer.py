# yss_orbit\backend\apps\integration\api\serializers\integration_serializer.py
from rest_framework import serializers
from apps.platform.models import Integration

class IntegrationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Integration
        fields = [
            "id", "name", "provider", "is_active", "settings",
            "created_at", "updated_at"
        ]
        read_only_fields = ["id", "created_at", "updated_at"]

class IntegrationCreateSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=255)
    provider = serializers.ChoiceField(choices=Integration.Provider.choices)
    credentials = serializers.DictField(required=False, default=dict)
    settings = serializers.DictField(required=False, default=dict)

class IntegrationUpdateSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=255, required=False)
    credentials = serializers.DictField(required=False)
    settings = serializers.DictField(required=False)
    is_active = serializers.BooleanField(required=False)
