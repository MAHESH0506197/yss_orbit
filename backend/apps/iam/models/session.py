# yss_orbit\backend\apps\users\models\session.py
"""
apps/users/models/session.py

Persisted session model — one row per issued refresh token.

Security design:
- refresh_token_jti (unique) is the JWT "jti" claim from the refresh token.
- On token rotation, the old JTI is replaced by a new one.
- If an old (already-rotated) JTI is presented, ALL sessions for that user
  are revoked (reuse detection).
- device_info is informational only; never trusted for auth decisions.
"""
from __future__ import annotations

import uuid

from django.db import models


class Session(models.Model):
    """
    Maps a refresh token JTI to a user session.

    is_active=False means the session (and its refresh token) has been revoked.
    Expired sessions are cleaned up by a periodic Celery task.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        "iam.User",
        on_delete=models.CASCADE,
        related_name="sessions",
        db_index=True,
    )
    # The jti claim of the CURRENTLY VALID refresh token for this session.
    refresh_token_jti = models.CharField(
        max_length=255,
        unique=True,
        db_index=True,
        help_text="JWT jti claim of the active refresh token.",
    )
    device_info = models.JSONField(
        default=dict,
        blank=True,
        help_text="Browser, OS, device type parsed from user-agent.",
    )
    ip_address = models.GenericIPAddressField(
        protocol="both",
        unpack_ipv4=True,
        null=True,
        blank=True,
    )
    user_agent = models.TextField(blank=True, default="")
    is_active = models.BooleanField(default=True, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    last_active_at = models.DateTimeField(auto_now=True)
    expires_at = models.DateTimeField(
        db_index=True,
        help_text="UTC expiry matching the refresh token's exp claim.",
    )

    class Meta:
        app_label = "users"
        db_table = "users_session"
        verbose_name = "Session"
        verbose_name_plural = "Sessions"
        indexes = [
            models.Index(
                fields=["user", "is_active"],
                name="users_session_user_active_idx",
            ),
            models.Index(
                fields=["expires_at"],
                name="users_session_expires_idx",
            ),
        ]
        ordering = ["-created_at"]

    def __str__(self) -> str:  # pragma: no cover
        return f"Session(user={self.user_id}, active={self.is_active})"
