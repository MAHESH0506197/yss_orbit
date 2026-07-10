# yss_orbit\backend\apps\users\models\user.py
"""
YSS Orbit — Custom User Model
Central user identity. Extended by UserBusinessUnit for BU membership.
AUTH_USER_MODEL = 'iam.User'
"""
from __future__ import annotations

import os
import uuid
from datetime import timedelta
from typing import ClassVar

from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.core.validators import RegexValidator
from django.db import models
from django.utils import timezone


def get_avatar_upload_path(instance, filename):
    ext = filename.split('.')[-1]
    # B11 Sec 3.3 - Predictable file paths are PROHIBITED. UUIDs must be used.
    random_filename = f"{uuid.uuid4().hex}.{ext}"
    return f"avatars/{instance.id}/{random_filename}"


class UserManager(BaseUserManager["User"]):
    """Custom manager for the User model."""

    def create_user(
        self,
        username: str,
        email: str,
        password: str | None = None,
        **extra_fields: object,
    ) -> "User":
        if not email:
            raise ValueError("Email is required.")
        if not username:
            raise ValueError("Username is required.")
        email = self.normalize_email(email)
        user = self.model(username=username, email=email, **extra_fields)
        if password:
            user.set_password(password)  # Argon2 hashing
        user.save(using=self._db)
        return user

    def create_superuser(
        self,
        username: str,
        email: str,
        password: str,
        **extra_fields: object,
    ) -> "User":
        extra_fields.setdefault("is_super_admin", True)
        extra_fields.setdefault("is_email_verified", True)
        extra_fields.setdefault("is_active", True)
        return self.create_user(username, email, password, **extra_fields)


class User(AbstractBaseUser):
    """
    Platform user identity.
    One user can belong to multiple business units via UserBusinessUnit.

    Authentication: JWT in HttpOnly cookies.
    Password hashing: Argon2 (configured in settings.PASSWORD_HASHERS).
    MFA: TOTP-based (RFC 6238) when mfa_enabled=True.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    username_validator = RegexValidator(
        regex=r'^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&._-])[A-Za-z\d@$!%*?&._-]{4,150}$',
        message='Username must contain at least one uppercase letter, one lowercase letter, one number, and one special character.',
        code='invalid_username'
    )
    
    username = models.CharField(
        max_length=150, 
        unique=True, 
        db_index=True,
        validators=[username_validator],
        help_text='Required. 4 to 150 characters. Letters, digits and @$!%*?&._- only. Must contain at least one uppercase letter, one lowercase letter, one number, and one special character.'
    )
    email = models.EmailField(unique=False, db_index=True)
    first_name = models.CharField(max_length=100, blank=True)
    last_name = models.CharField(max_length=100, blank=True)
    phone_number = models.CharField(max_length=20, blank=True, null=True)
    avatar = models.ImageField(upload_to=get_avatar_upload_path, null=True, blank=True)

    # Account status
    is_active = models.BooleanField(default=False, db_index=True)
    is_email_verified = models.BooleanField(default=False, db_index=True)
    is_super_admin = models.BooleanField(default=False, db_index=True)

    # MFA
    mfa_enabled = models.BooleanField(default=False)
    mfa_secret = models.CharField(max_length=64, blank=True, null=True)  # TOTP secret (encrypted)

    # Login security
    failed_login_attempts = models.PositiveSmallIntegerField(default=0)
    locked_until = models.DateTimeField(null=True, blank=True)
    last_login_at = models.DateTimeField(null=True, blank=True)
    last_login_ip = models.GenericIPAddressField(null=True, blank=True)

    # Password management
    password_changed_at = models.DateTimeField(null=True, blank=True)

    # Audit
    created_at = models.DateTimeField(auto_now_add=True)
    created_by_id = models.UUIDField(null=True, blank=True)
    created_reason = models.TextField(blank=True, default="")
    
    updated_at = models.DateTimeField(auto_now=True)
    updated_by_id = models.UUIDField(null=True, blank=True)
    updated_reason = models.TextField(blank=True, default="")
    
    is_deleted = models.BooleanField(default=False, db_index=True)
    deleted_at = models.DateTimeField(null=True, blank=True)
    deleted_by_id = models.UUIDField(null=True, blank=True)
    deleted_reason = models.TextField(blank=True, default="")
    
    # Custom restore audit logs
    restored_at = models.DateTimeField(null=True, blank=True)
    restored_by_id = models.UUIDField(null=True, blank=True)
    restored_reason = models.TextField(blank=True, default="")

    # Preferences
    timezone = models.CharField(max_length=64, default="Asia/Kolkata")
    language = models.CharField(max_length=10, default="en")
    theme = models.CharField(
        max_length=10,
        choices=[("light", "Light"), ("dark", "Dark"), ("system", "System")],
        default="system",
    )

    objects = UserManager()

    USERNAME_FIELD = "username"
    REQUIRED_FIELDS = ["email"]

    class Meta:
        db_table = "users"
        verbose_name = "User"
        verbose_name_plural = "Users"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["email", "is_deleted"]),
            models.Index(fields=["username", "is_deleted"]),
        ]

    def __str__(self) -> str:
        return f"{self.username} <{self.email}>"

    @property
    def full_name(self) -> str:
        return f"{self.first_name} {self.last_name}".strip() or self.username

    def save(self, *args, **kwargs):
        # Enforce activation logic
        # If user is marked inactive (and it's not a super_admin bypassing), force email verification to False
        if not self.is_active and not self.is_super_admin:
            self.is_email_verified = False
            
        super().save(*args, **kwargs)

    # ─── Lock / Security ────────────────────────────────────────────────────

    def is_locked(self) -> bool:
        """True if account is temporarily locked due to too many failed attempts."""
        if self.locked_until is None:
            return False
        return timezone.now() < self.locked_until

    def increment_failed_attempts(self, lockout_minutes: int = 30) -> None:
        """
        Increment failed login counter.
        Locks account after 5 attempts for lockout_minutes.
        """
        from django.conf import settings
        max_attempts = getattr(settings, "LOGIN_MAX_ATTEMPTS", 5)

        self.failed_login_attempts += 1
        if self.failed_login_attempts >= max_attempts:
            self.locked_until = timezone.now() + timedelta(minutes=lockout_minutes)
        self.save(update_fields=["failed_login_attempts", "locked_until", "updated_at"])

    def reset_failed_attempts(self) -> None:
        """Reset after successful login."""
        self.failed_login_attempts = 0
        self.locked_until = None
        self.save(update_fields=["failed_login_attempts", "locked_until", "updated_at"])

    def record_login(self, ip_address: str) -> None:
        """Record successful login metadata."""
        self.last_login_at = timezone.now()
        self.last_login_ip = ip_address
        self.save(update_fields=["last_login_at", "last_login_ip", "updated_at"])

    def soft_delete(self, deleted_by_id=None, reason="") -> None:
        """Soft-delete user account."""
        self.is_deleted = True
        self.is_active = False
        self.deleted_at = timezone.now()
        self.deleted_by_id = deleted_by_id
        self.deleted_reason = reason
        self.save(update_fields=["is_deleted", "is_active", "deleted_at", "updated_at", "deleted_by_id", "deleted_reason"])

    def restore(self, restored_by_id=None, reason="") -> None:
        """Restore soft-deleted user account."""
        self.is_deleted = False
        self.is_active = True
        self.deleted_at = None
        self.deleted_by_id = None
        self.deleted_reason = ""
        self.restored_at = timezone.now()
        self.restored_by_id = restored_by_id
        self.restored_reason = reason
        self.save(update_fields=[
            "is_deleted", "is_active", "deleted_at", "updated_at", 
            "deleted_by_id", "deleted_reason", "restored_at", 
            "restored_by_id", "restored_reason"
        ])
