# yss_orbit\backend\apps\webhook\models.py
"""
YSS Orbit — Webhooks Models
Outbound webhook delivery with signature verification, retry logic, and dead-letter queue.
"""
from __future__ import annotations

import uuid

from django.db import models

from apps.platform.models.base import TenantModel


class WebhookEndpoint(TenantModel):
    """
    A registered webhook endpoint that receives event notifications.
    Each endpoint subscribes to specific event types.
    """

    class Status(models.TextChoices):
        ACTIVE = "ACTIVE", "Active"
        INACTIVE = "INACTIVE", "Inactive"
        SUSPENDED = "SUSPENDED", "Suspended (too many failures)"

    url = models.URLField(max_length=2048)
    secret = models.CharField(
        max_length=256,
        help_text="HMAC-SHA256 signing secret. Never expose in API responses.",
    )
    description = models.CharField(max_length=255, blank=True)
    status = models.CharField(
        max_length=15, choices=Status.choices, default=Status.ACTIVE, db_index=True
    )

    # Event subscriptions (list of event type codes)
    subscribed_events = models.JSONField(
        default=list,
        help_text="List of event type strings this endpoint subscribes to. e.g. ['billing.invoice.created']",
    )

    # Failure tracking
    consecutive_failures = models.PositiveIntegerField(default=0)
    last_failure_at = models.DateTimeField(null=True, blank=True)
    last_success_at = models.DateTimeField(null=True, blank=True)

    # Config
    timeout_seconds = models.PositiveSmallIntegerField(default=10)
    max_retries = models.PositiveSmallIntegerField(default=3)

    created_by_id = models.UUIDField(null=True, blank=True)

    class Meta(TenantModel.Meta):
        db_table = "webhook_endpoints"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["business_unit_id", "status"]),
        ]

    def __str__(self) -> str:
        return f"Webhook({self.url[:50]} / {self.status})"


class WebhookDelivery(TenantModel):
    """
    Individual webhook delivery attempt.
    Append-only audit trail of all delivery attempts.
    """

    class DeliveryStatus(models.TextChoices):
        PENDING = "PENDING", "Pending"
        IN_FLIGHT = "IN_FLIGHT", "In Flight"
        SUCCESS = "SUCCESS", "Delivered Successfully"
        FAILED = "FAILED", "Delivery Failed"
        DEAD_LETTER = "DEAD_LETTER", "Dead Letter (max retries exceeded)"

    endpoint = models.ForeignKey(
        WebhookEndpoint, on_delete=models.CASCADE, related_name="deliveries"
    )
    event_type = models.CharField(max_length=100, db_index=True)
    event_id = models.UUIDField(db_index=True, help_text="ID of the source event.")
    payload = models.JSONField(help_text="The JSON payload sent to the endpoint.")

    status = models.CharField(
        max_length=15,
        choices=DeliveryStatus.choices,
        default=DeliveryStatus.PENDING,
        db_index=True,
    )

    attempt_count = models.PositiveSmallIntegerField(default=0)
    next_retry_at = models.DateTimeField(null=True, blank=True, db_index=True)

    # Response tracking
    response_status_code = models.PositiveSmallIntegerField(null=True, blank=True)
    response_body = models.TextField(blank=True)
    error_message = models.TextField(blank=True)

    # Timing
    delivered_at = models.DateTimeField(null=True, blank=True)
    duration_ms = models.PositiveIntegerField(null=True, blank=True)

    class Meta(TenantModel.Meta):
        db_table = "webhook_deliveries"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["business_unit_id", "status", "next_retry_at"]),
            models.Index(fields=["endpoint", "status"]),
            models.Index(fields=["event_type", "created_at"]),
        ]

    def __str__(self) -> str:
        return f"Delivery({self.event_type} → {self.endpoint.url[:40]} [{self.status}])"
