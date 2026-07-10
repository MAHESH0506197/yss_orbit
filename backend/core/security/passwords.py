# yss_orbit\backend\core\security\passwords.py
"""
YSS Orbit - Passwords
Handles password policies, entropy checking, and secure hashing.
"""
from __future__ import annotations

import re
import logging
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from django.contrib.auth.hashers import make_password, check_password

logger = logging.getLogger(__name__)


class PasswordService:
    """
    Enterprise-grade password management service.
    Enforces complexity rules and secure hashing.
    """

    MIN_LENGTH = 12

    @classmethod
    def validate_complexity(cls, password: str) -> None:
        """
        Validate password against enterprise policies.
        Raises ValidationError if policies are not met.
        """
        if len(password) < cls.MIN_LENGTH:
            raise ValidationError(f"Password must be at least {cls.MIN_LENGTH} characters long.")

        if not re.search(r"[A-Z]", password):
            raise ValidationError("Password must contain at least one uppercase letter.")

        if not re.search(r"[a-z]", password):
            raise ValidationError("Password must contain at least one lowercase letter.")

        if not re.search(r"\d", password):
            raise ValidationError("Password must contain at least one number.")

        if not re.search(r"[!@#$%^&*(),.?\":{}|<>]", password):
            raise ValidationError("Password must contain at least one special character.")

        # Also leverage Django's built-in validators (which can check against common passwords)
        validate_password(password)

    @staticmethod
    def hash_password(password: str) -> str:
        """
        Hashes a password securely.
        Uses Django's default hasher (typically PBKDF2 or Argon2 if configured).
        """
        return make_password(password)

    @staticmethod
    def verify_password(password: str, hashed_password: str) -> bool:
        """
        Verifies a plaintext password against a hashed one.
        """
        return check_password(password, hashed_password)
