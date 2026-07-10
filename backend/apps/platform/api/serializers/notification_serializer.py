# yss_orbit\backend\apps\notification\api\serializers\notification_serializer.py
from rest_framework import serializers
from apps.platform.models.notification_model import Notification
from apps.platform.models.notification_preference_model import NotificationPreference

class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = ['id', 'notification_type', 'title', 'body', 'is_read', 'read_at', 'action_url', 'created_at']
        read_only_fields = ['id', 'notification_type', 'title', 'body', 'action_url', 'created_at']

class NotificationPreferenceSerializer(serializers.ModelSerializer):
    class Meta:
        model = NotificationPreference
        fields = ['email_enabled', 'sms_enabled', 'push_enabled', 'in_app_enabled', 'marketing_enabled', 'billing_enabled', 'system_alerts_enabled']
