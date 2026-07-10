# yss_orbit\backend\apps\audit\models.py
"""
YSS Orbit — Audit Log
Immutable, append-only audit trail for every mutation.
DB-level REVOKE UPDATE, DELETE enforced in production via migration.
PII NEVER stored in old_values/new_values.
"""
from __future__ import annotations

import uuid
from typing import Any

from django.db import models


class AuditLog(models.Model):
    """
    Append-only audit log record.

    Created for every CREATE, UPDATE, DELETE, and custom business event.
    Immutable — never updated or deleted at application level.

    PII rules:
    - old_values/new_values MUST NOT contain PAN, bank_account, Aadhaar, phone, email
    - Masking must occur BEFORE calling create_log()
    """

    # Action choices
    class Action(models.TextChoices):
        CREATE = "CREATE", "Created"
        UPDATE = "UPDATE", "Updated"
        DELETE = "DELETE", "Deleted"
        LOGIN = "LOGIN", "Logged In"
        LOGOUT = "LOGOUT", "Logged Out"
        LOGIN_FAILED = "LOGIN_FAILED", "Login Failed"
        PASSWORD_CHANGED = "PASSWORD_CHANGED", "Password Changed"
        MFA_ENABLED = "MFA_ENABLED", "MFA Enabled"
        MFA_DISABLED = "MFA_DISABLED", "MFA Disabled"
        PERMISSION_GRANTED = "PERMISSION_GRANTED", "Permission Granted"
        PERMISSION_REVOKED = "PERMISSION_REVOKED", "Permission Revoked"
        ROLE_ASSIGNED = "ROLE_ASSIGNED", "Role Assigned"
        IMPERSONATION_STARTED = "IMPERSONATION_STARTED", "Impersonation Started"
        IMPERSONATION_ENDED = "IMPERSONATION_ENDED", "Impersonation Ended"
        DATA_EXPORTED = "DATA_EXPORTED", "Data Exported"
        SUBSCRIPTION_CHANGED = "SUBSCRIPTION_CHANGED", "Subscription Changed"
        MODULE_ACTIVATED = "MODULE_ACTIVATED", "Module Activated"
        MODULE_DEACTIVATED = "MODULE_DEACTIVATED", "Module Deactivated"
        STOCK_ADJUSTED = "STOCK_ADJUSTED", "Stock Adjusted"
        PAYROLL_RUN = "PAYROLL_RUN", "Payroll Run"
        PAYMENT_PROCESSED = "PAYMENT_PROCESSED", "Payment Processed"
        CUSTOM = "CUSTOM", "Custom Event"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    # Who
    user_id = models.UUIDField(null=True, blank=True, db_index=True)
    user_username = models.CharField(max_length=150, blank=True)
    is_impersonated = models.BooleanField(default=False)
    impersonated_by_id = models.UUIDField(null=True, blank=True)

    # Where (tenant context)
    organization_id = models.UUIDField(null=True, blank=True)
    business_unit_id = models.UUIDField(null=True, blank=True, db_index=True)

    # What
    action = models.CharField(max_length=40, choices=Action.choices, db_index=True)
    resource_type = models.CharField(max_length=100, default='UNKNOWN', db_index=True)  # e.g. "inventory.Item"
    resource_id = models.UUIDField(null=True, blank=True, db_index=True)
    resource_display = models.CharField(max_length=255, blank=True)  # Human-readable name

    # Change data (PII-masked before storing)
    old_values = models.JSONField(null=True, blank=True)
    new_values = models.JSONField(null=True, blank=True)

    # Request metadata
    correlation_id = models.CharField(max_length=36, blank=True, db_index=True)
    request_id = models.CharField(max_length=36, blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True)
    endpoint = models.CharField(max_length=255, blank=True)
    http_method = models.CharField(max_length=10, blank=True)

    # Additional context
    extra = models.JSONField(default=dict, blank=True)

    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    # Integrity chain (for tamper detection)
    chain_hash = models.CharField(max_length=64, blank=True)

    class Meta:
        db_table = "audit_logs"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["business_unit_id", "created_at"]),
            models.Index(fields=["user_id", "created_at"]),
            models.Index(fields=["resource_type", "resource_id"]),
            models.Index(fields=["action", "created_at"]),
            models.Index(fields=["correlation_id"]),
        ]

    def save(self, *args: Any, **kwargs: Any) -> None:
        """Enforce immutability — audit logs cannot be updated."""
        if self.pk:
            try:
                AuditLog.objects.get(pk=self.pk)
                raise PermissionError("Audit log entries are immutable.")
            except AuditLog.DoesNotExist:
                pass  # New record, allow save
        super().save(*args, **kwargs)

    def delete(self, *args: Any, **kwargs: Any) -> tuple[int, dict[str, int]]:
        raise PermissionError("Audit log entries cannot be deleted.")
