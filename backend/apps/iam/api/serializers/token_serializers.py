# yss_orbit\backend\apps\users\api\serializers\token_serializers.py
from rest_framework import serializers

class BaseSerializer(serializers.Serializer):
    id = serializers.UUIDField(read_only=True)
    created_at = serializers.DateTimeField(read_only=True)

class CustomTokenObtainSerializer(serializers.Serializer):
    pass

class CustomTokenRefreshSerializer(serializers.Serializer):
    pass

