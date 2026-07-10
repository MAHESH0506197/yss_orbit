# yss_orbit\backend\apps\notification\api\serializers\notification_response_serializer.py
from rest_framework import serializers

class NotificationResponseSerializer(serializers.Serializer):
    """
    Standardized response wrapper for notification APIs.
    """
    status = serializers.CharField(default='success')
    message = serializers.CharField()
    data = serializers.DictField()
    unread_count = serializers.IntegerField(required=False)
