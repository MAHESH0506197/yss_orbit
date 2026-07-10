# yss_orbit\backend\apps\notification\notification_serializer.py
"""
YSS Orbit — Notification Serializers
DRF serializers for Notification read/list endpoints.
Write operations (send, mark_read) use service-layer inputs, not serializers.
"""
from __future__ import annotations

from rest_framework import serializers

from apps.platform.notification_model import Notification, NotificationTemplate


class NotificationSerializer(serializers.ModelSerializer):
    """
    Serializes a Notification for list / detail responses.
    Read-only — mutations go through NotificationService.
    """

    notification_type_display = serializers.CharField(
        source="get_notification_type_display",
        read_only=True,
    )
    channel_display = serializers.CharField(
        source="get_channel_display",
        read_only=True,
    )

    class Meta:
        model = Notification
        fields = [
            "id",
            "business_unit_id",
            "recipient_id",
            "notification_type",
            "notification_type_display",
            "channel",
            "channel_display",
            "title",
            "body",
            "data",
            "action_url",
            "is_read",
            "read_at",
            "expires_at",
            "correlation_id",
            "created_at",
        ]
        read_only_fields = fields


class NotificationUnreadCountSerializer(serializers.Serializer):
    """Response shape for the unread-count endpoint."""

    count = serializers.IntegerField(min_value=0)


class NotificationTemplateSerializer(serializers.ModelSerializer):
    """Admin-facing serializer for NotificationTemplate."""

    channel_display = serializers.CharField(
        source="get_channel_display",
        read_only=True,
    )

    class Meta:
        model = NotificationTemplate
        fields = [
            "id",
            "code",
            "channel",
            "channel_display",
            "subject_template",
            "body_template",
            "is_active",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]
