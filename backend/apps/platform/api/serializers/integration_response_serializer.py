# yss_orbit\backend\apps\integration\api\serializers\integration_response_serializer.py
from rest_framework import serializers

class IntegrationResponseSerializer(serializers.Serializer):
    id = serializers.UUIDField(read_only=True)
    created_at = serializers.DateTimeField(read_only=True)
