# yss_orbit\backend\core\auth\jwt_handler.py
"""
YSS Orbit — Token Service
Issues, rotates, and revokes JWT tokens.
Refresh token rotation with reuse detection — on reuse, ALL sessions are revoked.

FIX-BUG14 (CRITICAL): _load_platform_permissions() previously had a stub
comment "populated after RBAC app is implemented" and unconditionally
returned [] for non-super-admins. The RBAC app IS implemented (apps/rbac) —
this wires it in via RBACService.get_user_permissions_all_bus().

FIX-BUG13/14/17 chain summary (see also core/permissions/rbac_permission.py
and apps/users/api/views/auth_views.py):
  - This claim feeds request.auth["permissions"] (raw JWT, used as a fallback)
  - me_view() reads request.auth.get("permissions", []) → frontend authStore
  - HasRBACPermission's PRIMARY source is request.security_context.permissions,
    which is BU-scoped and computed fresh per-request by
    RBACService.get_user_permissions_as_frozenset() once business_unit_id is known.
  - This JWT claim is therefore a cross-BU SUPERSET, useful for frontend
    menu-visibility hints before a BU is selected (B07 §5.14: menu
    visibility is UX-only, backend always re-checks the BU-scoped set).
"""
from __future__ import annotations

import logging
import uuid
from datetime import timedelta
from typing import Any

from django.conf import settings
from django.utils import timezone
from rest_framework_simplejwt.tokens import RefreshToken

from apps.iam.models import User, UserSession

logger = logging.getLogger(__name__)


class TokenService:
    """
    JWT token lifecycle management.

    Security properties:
    - Access token: 15-minute lifetime, contains permissions + role
    - Refresh token: 7-day lifetime, rotated on every use
    - Reuse detection: if old refresh token presented → revoke ALL sessions
    - Tokens delivered ONLY via HttpOnly cookies
    """

    @staticmethod
    def issue_tokens(
        user: User,
        ip_address: str,
        user_agent: str,
        correlation_id: str,
    ) -> tuple[str, str, uuid.UUID]:
        """
        Create a new access + refresh token pair and record the session.

        Returns:
            (access_token_str, refresh_token_str, session_id)
        """
        # Load permissions for this user (platform-level — BU specific handled per-request)
        permissions = TokenService._load_platform_permissions(user)

        refresh = RefreshToken.for_user(user)

        # Embed custom claims in tokens
        refresh["token_type"] = "refresh"
        refresh["permissions"] = permissions
        refresh["is_super_admin"] = user.is_super_admin

        access = refresh.access_token
        access["token_type"] = "access"
        access["permissions"] = permissions
        access["is_super_admin"] = user.is_super_admin

        # Record session
        session = UserSession.objects.create(
            user=user,
            refresh_token_jti=str(refresh["jti"]),
            ip_address=ip_address,
            user_agent=user_agent[:500],
            device_info={"ip": ip_address, "ua": user_agent[:200]},
            is_active=True,
            expires_at=timezone.now() + timedelta(days=7),
        )

        logger.info(
            "Tokens issued",
            extra={
                "user_id": str(user.id),
                "session_id": str(session.id),
                "jti": str(refresh["jti"]),
                "correlation_id": correlation_id,
            },
        )

        return str(access), str(refresh), session.id

    @staticmethod
    def refresh_tokens(
        refresh_token_str: str,
        correlation_id: str,
    ) -> tuple[str, str]:
        """
        Rotate refresh token.

        Security:
        - Validates JTI exists in DB and is active
        - Detects token reuse → revokes ALL sessions for that user

        Returns:
            (new_access_token, new_refresh_token)

        Raises:
            SessionRevokedError: Token already rotated (possible reuse)
            TokenInvalidError: Token is invalid
        """
        from rest_framework_simplejwt.tokens import RefreshToken as RT
        from apps.platform.core_exceptions import SessionRevokedError, TokenInvalidError

        try:
            token = RT(refresh_token_str)
            jti = str(token["jti"])
            user_id = token["user_id"]
        except Exception:
            raise TokenInvalidError()

        # Check if session exists and is active
        session = (
            UserSession.objects
            .filter(refresh_token_jti=jti, is_active=True)
            .first()
        )

        if session is None:
            # JTI exists but not active → token reuse detected → revoke ALL sessions
            existing = UserSession.objects.filter(user_id=user_id).first()
            if existing:
                logger.error(
                    "SECURITY: Refresh token reuse detected — revoking all sessions",
                    extra={
                        "user_id": str(user_id),
                        "jti": jti,
                        "correlation_id": correlation_id,
                    },
                )
                UserSession.objects.filter(user_id=user_id).update(is_active=False)
            raise SessionRevokedError()

        # Revoke old session
        session.is_active = False
        session.save(update_fields=["is_active"])

        # Issue new token pair
        user = User.objects.get(id=user_id)
        permissions = TokenService._load_platform_permissions(user)

        new_refresh = RT.for_user(user)
        new_refresh["token_type"] = "refresh"
        new_refresh["permissions"] = permissions
        new_refresh["is_super_admin"] = user.is_super_admin

        new_access = new_refresh.access_token
        new_access["token_type"] = "access"
        new_access["permissions"] = permissions
        new_access["is_super_admin"] = user.is_super_admin

        # Create new session record
        UserSession.objects.create(
            user=user,
            refresh_token_jti=str(new_refresh["jti"]),
            ip_address=session.ip_address,
            user_agent=session.user_agent,
            device_info=session.device_info,
            is_active=True,
            expires_at=timezone.now() + timedelta(days=7),
        )

        return str(new_access), str(new_refresh)

    @staticmethod
    def revoke_session(jti: str) -> None:
        """Revoke a specific session by JTI."""
        UserSession.objects.filter(refresh_token_jti=jti).update(is_active=False)

    @staticmethod
    def revoke_all_sessions(user_id: uuid.UUID) -> int:
        """Revoke ALL sessions for a user. Returns number revoked."""
        return UserSession.objects.filter(user_id=user_id, is_active=True).update(is_active=False)

    @staticmethod
    def set_cookies(
        response: Any,
        access_token: str,
        refresh_token: str,
    ) -> None:
        """
        Set JWT tokens in HttpOnly, Secure cookies.
        Tokens MUST NOT be in response body — only in cookies.
        """
        access_name = getattr(settings, "JWT_AUTH_COOKIE", "yss_access")
        refresh_name = getattr(settings, "JWT_REFRESH_COOKIE", "yss_refresh")
        secure = getattr(settings, "JWT_AUTH_COOKIE_SECURE", False)
        samesite = getattr(settings, "JWT_AUTH_COOKIE_SAMESITE", "Lax")

        response.set_cookie(
            key=access_name,
            value=access_token,
            max_age=15 * 60,  # 15 minutes
            httponly=True,
            secure=secure,
            samesite=samesite,
            path="/",
        )
        response.set_cookie(
            key=refresh_name,
            value=refresh_token,
            max_age=7 * 24 * 60 * 60,  # 7 days
            httponly=True,
            secure=secure,
            samesite=samesite,
            path="/api/v1/auth/token/",  # Scoped path for security
        )

    @staticmethod
    def clear_cookies(response: Any) -> None:
        """Clear JWT cookies on logout."""
        access_name = getattr(settings, "JWT_AUTH_COOKIE", "yss_access")
        refresh_name = getattr(settings, "JWT_REFRESH_COOKIE", "yss_refresh")
        response.delete_cookie(access_name, path="/")
        response.delete_cookie(refresh_name, path="/api/v1/auth/token/")

    @staticmethod
    def _load_platform_permissions(user: User) -> list[str]:
        """
        FIX-BUG14: Load the cross-BU permission superset for this user,
        embedded as the "permissions" claim in both access and refresh tokens.

        - Super admins: ["*"] (SecurityContext.has_permission() and
          HasRBACPermission both short-circuit on is_super_admin anyway;
          "*" is a human-readable marker, not parsed as a wildcard).
        - Everyone else: union of permission codes across ALL active
          UserRole assignments, across every business unit
          (RBACService.get_user_permissions_all_bus).

        This is a SUPERSET used for JWT-claim/menu-hint purposes only.
        The AUTHORITATIVE, enforced permission set is always the BU-scoped
        SecurityContext.permissions, recomputed per-request by
        CookieJWTAuthentication once business_unit_id is known
        (apps/users/api/authentication.py:_build_security_context).
        """
        if user.is_super_admin:
            return ["*"]  # Super admin has all permissions

        from apps.iam.services.rbac_service import RBACService
        return list(RBACService.get_user_permissions_all_bus(user.id))
