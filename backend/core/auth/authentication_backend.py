# yss_orbit\backend\core\auth\authentication_backend.py
"""
YSS Orbit — Authentication Service
Implements the mandatory 7-step login flow.
Generic error messages for steps 1-4 prevent user enumeration.
"""
from __future__ import annotations

import logging
import uuid
from dataclasses import dataclass
from enum import Enum
from typing import Any

from django.utils import timezone

from apps.iam.models import User, UserSession, OTPPurpose
from apps.platform.core_exceptions import (
    AccountInactiveError,
    AccountLockedError,
    EmailNotVerifiedError,
    InvalidCredentialsError,
    MFARequiredError,
    BusinessUnitMembershipError,
)

logger = logging.getLogger(__name__)


class LoginStatus(str, Enum):
    AUTHENTICATED = "AUTHENTICATED"
    EMAIL_VERIFICATION_REQUIRED = "EMAIL_VERIFICATION_REQUIRED"
    MFA_REQUIRED = "MFA_REQUIRED"


@dataclass
class LoginResult:
    status: LoginStatus
    user_id: uuid.UUID
    email: str
    username: str
    requires_otp_purpose: OTPPurpose | None = None
    access_token: str | None = None
    refresh_token: str | None = None
    session_id: uuid.UUID | None = None
    allowed_business_units: list[dict[str, Any]] | None = None


class AuthService:
    """
    Core authentication service.

    7-Step Login Flow (MANDATORY ORDER):
    Step 1: User exists
    Step 2: User is active
    Step 3: Account not locked
    Step 4: Password matches (Argon2)
    Step 5: Email verified → if not, return EMAIL_VERIFICATION_REQUIRED
    Step 6: MFA enabled → if yes, return MFA_REQUIRED
    Step 7: Issue JWT tokens, create session, return AUTHENTICATED

    Steps 1-4 return IDENTICAL error message to prevent user enumeration.
    """

    @staticmethod
    def login(
        username: str,
        password: str,
        ip_address: str,
        user_agent: str,
        correlation_id: str,
    ) -> LoginResult:
        """
        Execute the 7-step login flow.

        Args:
            username: Username or email address
            password: Plaintext password (Argon2 verified)
            ip_address: Client IP for audit
            user_agent: Browser/device info for session
            correlation_id: Request tracing ID

        Returns:
            LoginResult with status and relevant data

        Raises:
            InvalidCredentialsError: Steps 1-4 failures (intentionally generic)
            AccountLockedError: Account temporarily locked
            AccountInactiveError: Account suspended
        """
        from core.auth.jwt_handler import TokenService

        # ─── Step 1: User exists ─────────────────────────────────────────
        try:
            user = User.objects.select_related().get(username=username, is_deleted=False)
        except User.DoesNotExist:
            # Generic error — do NOT reveal that user doesn't exist
            logger.warning(
                "Login attempt: user not found",
                extra={"username": username[:50], "ip": ip_address, "correlation_id": correlation_id},
            )
            raise InvalidCredentialsError()

        # ─── Step 2: User is active ──────────────────────────────────────
        if not user.is_active:
            logger.warning(
                "Login attempt on inactive account",
                extra={"user_id": str(user.id), "correlation_id": correlation_id},
            )
            raise InvalidCredentialsError()  # Generic — don't reveal inactive status

        # ─── Step 3: Account not locked ──────────────────────────────────
        if user.is_locked():
            logger.warning(
                "Login attempt on locked account",
                extra={"user_id": str(user.id), "correlation_id": correlation_id},
            )
            minutes_left = int((user.locked_until - timezone.now()).total_seconds() / 60) + 1
            msg = f"Account is temporarily locked for {minutes_left} more minutes. Please wait, or use the Unlock Account option."
            raise AccountLockedError(message=msg, details={"minutes_left": minutes_left, "locked_until": user.locked_until.isoformat(), "username": user.username})

        # ─── Step 4: Password matches ─────────────────────────────────────
        if not user.check_password(password):
            user.increment_failed_attempts()
            logger.warning(
                "Login attempt: wrong password",
                extra={
                    "user_id": str(user.id),
                    "attempts": user.failed_login_attempts,
                    "correlation_id": correlation_id,
                },
            )
            raise InvalidCredentialsError()

        # Password correct — reset failed attempts counter
        user.reset_failed_attempts()

        # ─── Step 5: Email verified ───────────────────────────────────────
        if not user.is_email_verified:
            logger.info(
                "Login: email verification required",
                extra={"user_id": str(user.id), "correlation_id": correlation_id},
            )
            return LoginResult(
                status=LoginStatus.EMAIL_VERIFICATION_REQUIRED,
                user_id=user.id,
                email=user.email,
                username=user.username,
                requires_otp_purpose=OTPPurpose.EMAIL_VERIFICATION,
            )

        # ─── Step 6: MFA required ─────────────────────────────────────────
        if user.mfa_enabled:
            logger.info(
                "Login: MFA required",
                extra={"user_id": str(user.id), "correlation_id": correlation_id},
            )
            return LoginResult(
                status=LoginStatus.MFA_REQUIRED,
                user_id=user.id,
                email=user.email,
                username=user.username,
                requires_otp_purpose=OTPPurpose.MFA,
            )

        # ─── Step 7: Issue JWT tokens ─────────────────────────────────────
        access_token, refresh_token, session_id = TokenService.issue_tokens(
            user=user,
            ip_address=ip_address,
            user_agent=user_agent,
            correlation_id=correlation_id,
        )

        # Record login
        user.record_login(ip_address=ip_address)

        # Load user's business units
        allowed_bus = AuthService._get_user_business_units(user.id)

        # ─── Step 6.5: Strict Business Unit Check ────────────────────────
        if not user.is_super_admin and not allowed_bus:
            logger.warning(
                "Login attempt: non-superadmin without any business units",
                extra={"user_id": str(user.id), "correlation_id": correlation_id},
            )
            raise BusinessUnitMembershipError("You must be assigned to at least one Business Unit to login.")

        logger.info(
            "Login successful",
            extra={
                "user_id": str(user.id),
                "session_id": str(session_id),
                "correlation_id": correlation_id,
            },
        )

        return LoginResult(
            status=LoginStatus.AUTHENTICATED,
            user_id=user.id,
            email=user.email,
            username=user.username,
            access_token=access_token,
            refresh_token=refresh_token,
            session_id=session_id,
            allowed_business_units=allowed_bus,
        )

    @staticmethod
    def complete_mfa_login(
        user_id: uuid.UUID,
        mfa_code: str,
        ip_address: str,
        user_agent: str,
        correlation_id: str,
    ) -> LoginResult:
        """Called after MFA code verified — issues JWT tokens."""
        from core.auth.jwt_handler import TokenService

        user = User.objects.get(id=user_id, is_deleted=False, is_active=True)

        access_token, refresh_token, session_id = TokenService.issue_tokens(
            user=user,
            ip_address=ip_address,
            user_agent=user_agent,
            correlation_id=correlation_id,
        )
        user.record_login(ip_address=ip_address)
        allowed_bus = AuthService._get_user_business_units(user.id)

        if not user.is_super_admin and not allowed_bus:
            logger.warning(
                "MFA Login attempt: non-superadmin without any business units",
                extra={"user_id": str(user.id), "correlation_id": correlation_id},
            )
            raise BusinessUnitMembershipError("You must be assigned to at least one Business Unit to login.")

        return LoginResult(
            status=LoginStatus.AUTHENTICATED,
            user_id=user.id,
            email=user.email,
            username=user.username,
            access_token=access_token,
            refresh_token=refresh_token,
            session_id=session_id,
            allowed_business_units=allowed_bus,
        )

    @staticmethod
    def _get_user_business_units(user_id: uuid.UUID) -> list[dict[str, Any]]:
        """
        Load user's active business unit memberships.

        2.5 fix: Uses canonical UserBusinessUnitModel from apps.organization
        (table: ubu_memberships) instead of the legacy UserBusinessUnit
        (table: user_business_units in apps.iam.models).

        Also returns domain + name from BusinessUnit join — required by the
        frontend DomainGuard to determine which domain routes a user can access.
        """
        from apps.iam.models import User
        user = User.objects.only("is_super_admin").get(id=user_id)
        
        if user.is_super_admin:
            from apps.organization.models import BusinessUnit
            all_bus = BusinessUnit.objects.filter(is_active=True, is_deleted=False)
            return [
                {
                    "business_unit_id": str(bu.id),
                    "name":            bu.name,
                    "domain":          getattr(bu, "domain", "") or getattr(bu, "industry", ""),
                    "role_id":         None,
                }
                for bu in all_bus
            ]

        from apps.organization.models.user_business_unit_model import UserBusinessUnitModel
        memberships = (
            UserBusinessUnitModel.objects
            .filter(user_id=user_id, is_active_membership=True, is_deleted=False)
            .select_related("business_unit", "role")
        )
        return [
            {
                "business_unit_id": str(m.business_unit_id),
                "name":            m.business_unit.name if m.business_unit else "",
                "domain":          getattr(m.business_unit, "domain", "") or getattr(m.business_unit, "industry", ""),
                "role_id":         str(m.role_id) if m.role_id else None,
            }
            for m in memberships
        ]
