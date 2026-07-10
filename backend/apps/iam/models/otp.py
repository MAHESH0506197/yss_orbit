# yss_orbit\backend\apps\users\models\otp.py
"""
YSS Orbit — OTP Model
6-digit OTPs hashed with Argon2 before storage.
Single-use, purpose-scoped, max 5 attempts, 10-minute expiry.
"""
from __future__ import annotations

import uuid
from django.db import models
from django.utils import timezone


class OTPPurpose(models.TextChoices):
    EMAIL_VERIFICATION = "EMAIL_VERIFICATION", "Email Verification"
    MFA = "MFA", "Multi-Factor Authentication"
    PASSWORD_RESET = "PASSWORD_RESET", "Password Reset"
    ACCOUNT_UNLOCK = "ACCOUNT_UNLOCK", "Account Unlock"


class OTP(models.Model):
    """
    Stores Argon2-hashed OTPs. Plaintext is NEVER stored.

    Flow:
    1. generate_otp() → creates record with hashed OTP → returns plaintext to caller
    2. Caller sends plaintext to user via email/SMS
    3. verify_otp() → hashes user input → compares with stored hash
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        "iam.User",
        on_delete=models.CASCADE,
        related_name="otps",
        db_index=True,
    )
    hashed_otp = models.CharField(max_length=255)  # Argon2 hash
    purpose = models.CharField(
        max_length=30,
        choices=OTPPurpose.choices,
        db_index=True,
    )
    expires_at = models.DateTimeField(db_index=True)
    is_used = models.BooleanField(default=False, db_index=True)
    attempts = models.PositiveSmallIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "user_otps"
        verbose_name = "OTP"
        indexes = [
            models.Index(fields=["user", "purpose", "is_used"]),
            models.Index(fields=["expires_at", "is_used"]),
        ]

    def is_expired(self) -> bool:
        return timezone.now() > self.expires_at

    def increment_attempts(self) -> None:
        self.attempts += 1
        self.save(update_fields=["attempts"])

    def mark_used(self) -> None:
        self.is_used = True
        self.save(update_fields=["is_used"])
