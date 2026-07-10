# yss_orbit\backend\apps\users\models\membership.py
"""
YSS Orbit — User Business Unit Membership
Maps users to business units with a role assignment.
One user can be a member of multiple business units.
"""
from __future__ import annotations

import uuid
from django.db import models
from django.utils import timezone


class UserBusinessUnit(models.Model):
    """
    Junction model: User ↔ BusinessUnit membership.
    Each membership has a role (role_id) within that BU.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        "iam.User",
        on_delete=models.CASCADE,
        related_name="business_unit_memberships",
    )
    business_unit_id = models.UUIDField(db_index=True)
    is_active = models.BooleanField(default=True, db_index=True)
    joined_at = models.DateTimeField(default=timezone.now)
    invited_by_id = models.UUIDField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "user_business_units"
        unique_together = [("user", "business_unit_id")]
        indexes = [
            models.Index(fields=["user", "is_active"]),
            models.Index(fields=["business_unit_id", "is_active"]),
        ]


class UserSession(models.Model):
    """
    Active JWT sessions for a user.
    Tracked to enable:
    - Session listing
    - Individual session revocation
    - Reuse detection (refresh token rotation)
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        "iam.User",
        on_delete=models.CASCADE,
        related_name="sessions",
    )
    refresh_token_jti = models.CharField(
        max_length=255,
        unique=True,
        db_index=True,
        help_text="JWT ID (jti claim) of the refresh token. Used for rotation and reuse detection.",
    )
    device_info = models.JSONField(default=dict)  # browser, OS, device type
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True)
    is_active = models.BooleanField(default=True, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    last_active_at = models.DateTimeField(default=timezone.now)
    expires_at = models.DateTimeField(db_index=True)

    class Meta:
        db_table = "user_sessions"
        indexes = [
            models.Index(fields=["user", "is_active"]),
            models.Index(fields=["refresh_token_jti", "is_active"]),
            models.Index(fields=["expires_at", "is_active"]),
        ]


class PasswordHistory(models.Model):
    """
    Stores last 5 password hashes per user.
    Used to prevent reuse of recent passwords.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        "iam.User",
        on_delete=models.CASCADE,
        related_name="password_history",
    )
    hashed_password = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "user_password_history"
        ordering = ["-created_at"]
