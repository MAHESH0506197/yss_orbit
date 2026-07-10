# yss_orbit\backend\apps\users\services\otp_service.py
"""
YSS Orbit — OTP Service
Generates and verifies 6-digit OTPs using Argon2 hashing.
Rate-limited, purpose-scoped, single-use, 10-minute expiry, max 5 attempts.
"""
from __future__ import annotations

import logging
import random
import string
import uuid
from datetime import timedelta

from django.conf import settings
from django.core.cache import caches
from django.contrib.auth.hashers import check_password, make_password
from django.utils import timezone

from apps.platform.core_exceptions import (
    OTPExpiredError,
    OTPInvalidError,
    OTPMaxAttemptsError,
    OTPRateLimitError,
)
from apps.iam.models import OTP, OTPPurpose

logger = logging.getLogger(__name__)

_cache = caches["default"]

OTP_LENGTH = 6
OTP_EXPIRY_MINUTES = 10
OTP_MAX_ATTEMPTS = 5
OTP_RATE_LIMIT = 5   # Max generations per 10 minutes per user+purpose
OTP_RATE_WINDOW = 600  # 10 minutes in seconds


class OTPService:
    """
    Manages OTP lifecycle: generation, rate-limiting, verification.

    Security:
    - OTP plaintext NEVER stored — Argon2 hash only
    - Previous OTPs for same purpose invalidated on new generation
    - Brute-force protected: max 5 attempts before invalidation
    - Rate-limited: max 5 generations per 10-minute window
    """

    @staticmethod
    def generate(
        user_id: uuid.UUID,
        purpose: OTPPurpose | str,
        correlation_id: str = "unknown",
    ) -> str:
        """
        Generate and store a new OTP for the user.

        Returns:
            Plaintext OTP (6 digits) — caller is responsible for sending to user.

        Raises:
            OTPRateLimitError: If more than 5 OTPs generated in last 10 minutes.
        """
        # Rate limiting via Redis
        rate_key = f"otp_rate:{user_id}:{purpose}"
        current_count = _cache.get(rate_key, 0)
        if current_count >= OTP_RATE_LIMIT:
            logger.warning(
                "OTP rate limit exceeded",
                extra={
                    "user_id": str(user_id),
                    "purpose": purpose,
                    "count": current_count,
                    "correlation_id": correlation_id,
                },
            )
            raise OTPRateLimitError()

        # Invalidate any existing unused OTPs for this purpose
        OTP.objects.filter(
            user_id=user_id,
            purpose=purpose,
            is_used=False,
        ).update(is_used=True)

        # Generate 6-digit OTP
        otp_plaintext = "".join(random.choices(string.digits, k=OTP_LENGTH))

        # Hash with Argon2 before storing
        hashed = make_password(otp_plaintext)

        expiry = timezone.now() + timedelta(minutes=OTP_EXPIRY_MINUTES)

        OTP.objects.create(
            user_id=user_id,
            hashed_otp=hashed,
            purpose=purpose,
            expires_at=expiry,
            is_used=False,
            attempts=0,
        )

        # Increment rate limit counter
        if current_count == 0:
            _cache.set(rate_key, 1, timeout=OTP_RATE_WINDOW)
        else:
            _cache.incr(rate_key)

        logger.info(
            "OTP generated",
            extra={
                "user_id": str(user_id),
                "purpose": purpose,
                "correlation_id": correlation_id,
            },
        )

        return otp_plaintext

    @staticmethod
    def verify(
        user_id: uuid.UUID,
        otp_plaintext: str,
        purpose: OTPPurpose | str,
        correlation_id: str = "unknown",
        mark_used: bool = True,
    ) -> bool:
        """
        Verify an OTP.

        Returns True on success.

        Raises:
            OTPExpiredError: OTP has expired.
            OTPInvalidError: OTP hash doesn't match.
            OTPMaxAttemptsError: Too many failed attempts.
        """
        # Get the most recent unused OTP for this user+purpose
        otp_record = (
            OTP.objects.filter(
                user_id=user_id,
                purpose=purpose,
                is_used=False,
            )
            .order_by("-created_at")
            .first()
        )

        if otp_record is None:
            raise OTPInvalidError()

        # Check expiry
        if otp_record.is_expired():
            raise OTPExpiredError()

        # Check attempt count
        if otp_record.attempts >= OTP_MAX_ATTEMPTS:
            raise OTPMaxAttemptsError()

        # Increment attempt counter
        otp_record.increment_attempts()

        # Verify hash
        is_valid = check_password(otp_plaintext, otp_record.hashed_otp)

        if not is_valid:
            logger.warning(
                "OTP verification failed",
                extra={
                    "user_id": str(user_id),
                    "purpose": purpose,
                    "attempts": otp_record.attempts,
                    "correlation_id": correlation_id,
                },
            )
            raise OTPInvalidError()

        # Mark as used — prevents replay if requested
        if mark_used:
            otp_record.mark_used()

        logger.info(
            "OTP verified successfully",
            extra={
                "user_id": str(user_id),
                "purpose": purpose,
                "correlation_id": correlation_id,
            },
        )

        return True
