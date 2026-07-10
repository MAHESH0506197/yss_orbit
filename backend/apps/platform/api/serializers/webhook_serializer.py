# yss_orbit\backend\apps\integration\api\serializers\webhook_serializer.py
from rest_framework import serializers
from apps.platform.models import WebhookEndpoint

class WebhookSerializer(serializers.ModelSerializer):
    class Meta:
        model = WebhookEndpoint
        fields = [
            "id", "url", "description", "is_active", "events", 
            "created_at", "updated_at"
        ]
        read_only_fields = ["id", "created_at", "updated_at"]

class WebhookCreateSerializer(serializers.Serializer):
    url = serializers.URLField(max_length=1024)
    description = serializers.CharField(max_length=255, required=False, allow_blank=True)
    events = serializers.ListField(child=serializers.CharField())

class WebhookUpdateSerializer(serializers.Serializer):
    url = serializers.URLField(max_length=1024, required=False)
    description = serializers.CharField(max_length=255, required=False, allow_blank=True)
    events = serializers.ListField(child=serializers.CharField(), required=False)
    is_active = serializers.BooleanField(required=False)
