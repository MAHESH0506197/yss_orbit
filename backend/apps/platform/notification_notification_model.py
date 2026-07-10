# yss_orbit\backend\apps\notification\notification_model.py
"""
YSS Orbit — Notification Models
TenantModel-based notification records and Jinja2-powered notification templates.
Every notification is scoped to a business_unit and recipient.
"""
from __future__ import annotations

import uuid

from django.db import models

from apps.platform.models.base import TenantModel


# ─── Notification ─────────────────────────────────────────────────────────────

class NotificationType(models.TextChoices):
    SYSTEM = "SYSTEM", "System"
    INFO = "INFO", "Info"
    WARNING = "WARNING", "Warning"
    SUCCESS = "SUCCESS", "Success"
    ERROR = "ERROR", "Error"
    ACTION_REQUIRED = "ACTION_REQUIRED", "Action Required"


class NotificationChannel(models.TextChoices):
    IN_APP = "IN_APP", "In-App"
    EMAIL = "EMAIL", "Email"
    SMS = "SMS", "SMS"
    PUSH = "PUSH", "Push Notification"


class Notification(TenantModel):
    """
    A single notification sent to a recipient.

    TenantModel provides: id (UUID PK), business_unit_id, created_at,
    updated_at, is_active, is_deleted, and soft-delete support.

    Indexed on (recipient_id, is_read, created_at) to support the
    common query pattern: "unread notifications for user X in BU Y".
    """

    recipient_id = models.UUIDField(
        db_index=True,
        help_text="FK to users.User. Denormalised UUID for cross-DB safety.",
    )
    notification_type = models.CharField(
        max_length=20,
        choices=NotificationType.choices,
        default=NotificationType.INFO,
        db_index=True,
    )
    channel = models.CharField(
        max_length=10,
        choices=NotificationChannel.choices,
        default=NotificationChannel.IN_APP,
    )
    title = models.CharField(max_length=255)
    body = models.TextField()
    data = models.JSONField(
        default=dict,
        help_text="Structured payload for deep-links, e.g. {'invoice_id': 'uuid'}.",
    )
    action_url = models.CharField(
        max_length=500,
        blank=True,
        help_text="Frontend route to navigate on click, e.g. '/invoices/123'.",
    )

    # Read state
    is_read = models.BooleanField(default=False, db_index=True)
    read_at = models.DateTimeField(null=True, blank=True)

    # Lifecycle
    expires_at = models.DateTimeField(null=True, blank=True)
    correlation_id = models.CharField(max_length=36, db_index=True)

    # BaseModel already provides created_at with auto_now_add and db_index=True

    class Meta(TenantModel.Meta):
        db_table = "notifications"
        ordering = ["-created_at"]
        indexes = [
            models.Index(
                fields=["recipient_id", "is_read", "created_at"],
                name="notif_rcpt_read_idx",
            ),
            models.Index(
                fields=["business_unit_id", "recipient_id", "is_read"],
                name="notif_bu_recipient_read_idx",
            ),
            models.Index(
                fields=["expires_at"],
                name="notif_expires_at_idx",
            ),
        ]

    def __str__(self) -> str:
        return f"[{self.notification_type}] {self.title} → {self.recipient_id}"


# ─── Notification Template ────────────────────────────────────────────────────

class NotificationTemplate(models.Model):
    """
    Jinja2-powered template for rendering notification content.

    Templates are identified by a dot-notation code:
        'otp.email'         — OTP via email
        'payslip.ready'     — Payslip generation notification
        'invoice.due'       — Invoice due reminder

    Stored as platform-level data (no business_unit scoping)
    because they are shared across all tenants.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    code = models.CharField(
        max_length=100,
        unique=True,
        db_index=True,
        help_text="Dot-notation template code. e.g. 'otp.email', 'payslip.ready'.",
    )
    channel = models.CharField(
        max_length=10,
        choices=NotificationChannel.choices,
        db_index=True,
    )
    subject_template = models.CharField(
        max_length=500,
        blank=True,
        help_text="Jinja2 subject template. Used for EMAIL channel.",
    )
    body_template = models.TextField(
        help_text="Jinja2 body template. Variables injected at render time.",
    )
    is_active = models.BooleanField(default=True, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "notification_templates"
        ordering = ["code"]

    def __str__(self) -> str:
        return f"NotificationTemplate({self.code} / {self.channel})"
