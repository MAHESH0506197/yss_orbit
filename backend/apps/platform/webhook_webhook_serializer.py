# yss_orbit\backend\apps\webhook\webhook_serializer.py
from rest_framework import serializers
from apps.platform.models import WebhookEndpoint, WebhookDelivery


class WebhookEndpointSerializer(serializers.ModelSerializer):
    class Meta:
        model = WebhookEndpoint
        fields = [
            'id',
            'url',
            'description',
            'status',
            'subscribed_events',
            'consecutive_failures',
            'last_failure_at',
            'last_success_at',
            'timeout_seconds',
            'max_retries',
            'created_at',
            'updated_at',
        ]
        read_only_fields = [
            'id',
            'status',
            'consecutive_failures',
            'last_failure_at',
            'last_success_at',
            'created_at',
            'updated_at',
        ]


class WebhookEndpointCreateSerializer(serializers.ModelSerializer):
    secret = serializers.CharField(write_only=True, required=False)

    class Meta:
        model = WebhookEndpoint
        fields = [
            'id',
            'url',
            'secret',
            'description',
            'status',
            'subscribed_events',
            'timeout_seconds',
            'max_retries',
        ]
        read_only_fields = ['id', 'status']


class WebhookDeliverySerializer(serializers.ModelSerializer):
    class Meta:
        model = WebhookDelivery
        fields = [
            'id',
            'endpoint',
            'event_type',
            'event_id',
            'payload',
            'status',
            'attempt_count',
            'next_retry_at',
            'response_status_code',
            'response_body',
            'error_message',
            'delivered_at',
            'duration_ms',
            'created_at',
            'updated_at',
        ]
        read_only_fields = fields

