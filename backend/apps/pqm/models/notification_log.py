# yss_orbit\backend\apps\pqm\models\notification_log.py
"""
PQMNotificationLog — per-event, per-recipient, per-channel notification audit log.

Append-only. One row per (event, recipient, channel) combination.
Tracks delivery status: queued → sent / failed.
Errors never propagate to callers — logged here for observability.
"""
from __future__ import annotations

from typing import Any

from django.db import models

from apps.platform.models.base import TenantModel
from apps.pqm.enums import NotificationChannel


class PQMNotificationLog(TenantModel):
    """
    Audit log row for each notification dispatch attempt.

    status values: 'queued', 'sent', 'failed'
    Immutable once created — updates are written as new rows.
    status and error_detail may be updated (only these two fields)
    when the delivery worker processes the queue.
    """

    organization_id = models.UUIDField(
        db_index=True,
        null=False,
        help_text="Denormalized from BU for tenant isolation.",
    )
    nc = models.ForeignKey(
        "pqm.NonConformance",
        on_delete=models.PROTECT,
        related_name="notification_logs",
    )
    event_type = models.CharField(
        max_length=100,
        help_text="Event that triggered this notification (e.g. nc_submitted, nc_overdue).",
    )
    channel = models.CharField(
        max_length=20,
        choices=NotificationChannel.choices,
        help_text="Delivery channel: IN_APP, EMAIL, SMS, PUSH, WEBHOOK.",
    )
    recipient_id = models.UUIDField(
        db_index=True,
        help_text="UUID of the recipient user.",
    )
    status = models.CharField(
        max_length=20,
        default="queued",
        help_text="Delivery status: queued / sent / failed.",
    )
    error_detail = models.TextField(
        blank=True,
        default="",
        help_text="Error message if delivery failed.",
    )
    sent_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text="Timestamp of successful delivery.",
    )

    class Meta(TenantModel.Meta):
        db_table = "pqm_notification_log"
        ordering = ["-created_at"]

    def save(self, *args: Any, **kwargs: Any) -> None:
        """
        Append-only for new records. Updates are permitted only for
        status/error_detail/sent_at fields (set by delivery worker).
        """
        if self.pk and PQMNotificationLog.all_objects.filter(pk=self.pk).exists():
            # Only delivery worker fields allowed to update
            allowed_update_fields = {"status", "error_detail", "sent_at", "updated_at"}
            update_fields = set(kwargs.get("update_fields", []))
            if update_fields and not update_fields.issubset(allowed_update_fields):
                raise PermissionError(
                    "PQMNotificationLog: only status, error_detail, and sent_at may be updated."
                )
        super().save(*args, **kwargs)

    def __str__(self) -> str:
        return f"[{self.nc_id}] {self.event_type} → {self.recipient_id} via {self.channel}: {self.status}"
