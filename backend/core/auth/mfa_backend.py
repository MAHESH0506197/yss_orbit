# yss_orbit\backend\core\auth\mfa_backend.py
"""
YSS Orbit - MFA Backend
Handles Multi-Factor Authentication logic, including TOTP and Email/SMS OTPs.
"""
from __future__ import annotations

import logging
import pyotp
from typing import Optional
from django.utils import timezone
from apps.iam.models import User

logger = logging.getLogger(__name__)


class MFABackend:
    """
    Handles Multi-Factor Authentication validations.
    Supports TOTP (Authenticator Apps) and backup codes.
    """

    @staticmethod
    def verify_totp(user: User, code: str) -> bool:
        """
        Verify a Time-based One-Time Password (TOTP) against the user's secret.
        """
        if not user.mfa_enabled or not user.mfa_secret:
            logger.warning(f"MFA verification attempted for user without MFA: {user.id}")
            return False

        totp = pyotp.TOTP(user.mfa_secret)
        is_valid = totp.verify(code)

        if is_valid:
            logger.info(f"Successful MFA TOTP verification for user: {user.id}")
        else:
            logger.warning(f"Failed MFA TOTP verification for user: {user.id}")
            
        return is_valid

    @staticmethod
    def verify_backup_code(user: User, code: str) -> bool:
        """
        Verify and consume a backup code.
        """
        # Assuming user has a list of backup codes or related model
        # This is a placeholder for actual backup code logic
        if not hasattr(user, 'backup_codes') or not user.backup_codes:
            return False
            
        if code in user.backup_codes:
            user.backup_codes.remove(code)
            user.save(update_fields=["backup_codes"])
            logger.info(f"Backup code used by user: {user.id}")
            return True
            
        return False

    @staticmethod
    def generate_totp_secret() -> str:
        """
        Generate a new TOTP secret.
        """
        return pyotp.random_base32()

    @staticmethod
    def get_totp_uri(user: User, secret: str, issuer_name: str = "YSS Orbit") -> str:
        """
        Generate a TOTP provisioning URI for QR code generation.
        """
        return pyotp.totp.TOTP(secret).provisioning_uri(
            name=user.email,
            issuer_name=issuer_name
        )
