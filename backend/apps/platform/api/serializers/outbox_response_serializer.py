# yss_orbit\backend\apps\outbox\api\serializers\outbox_response_serializer.py
from rest_framework import serializers

class OutboxResponseSerializer(serializers.Serializer):
    id = serializers.UUIDField(read_only=True)
    created_at = serializers.DateTimeField(read_only=True)
