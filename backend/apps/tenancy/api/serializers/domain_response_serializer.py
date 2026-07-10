# yss_orbit\backend\apps\domain\api\serializers\domain_response_serializer.py
from rest_framework import serializers

class DomainResponseSerializer(serializers.Serializer):
    """
    Standardized response structure for domains.
    """
    status = serializers.CharField(default='success')
    message = serializers.CharField()
    data = serializers.DictField()
