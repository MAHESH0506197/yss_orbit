# yss_orbit\backend\apps\users\api\authentication.py
"""
YSS Orbit — Cookie JWT Authentication
Reads JWT access token from HttpOnly cookie (NOT Authorization header).
Builds immutable SecurityContext and attaches to request.
"""
from __future__ import annotations

import logging
import uuid
from typing import Any

from django.conf import settings
from rest_framework.exceptions import AuthenticationFailed
from rest_framework.request import Request
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from rest_framework_simplejwt.tokens import AccessToken

from apps.iam.security_context import SecurityContext
from apps.iam.models import User

logger = logging.getLogger(__name__)


class CookieJWTAuthentication(JWTAuthentication):
    """
    Reads JWT from HttpOnly cookie instead of Authorization header.
    Tokens in Authorization header are REJECTED (security: prevents XSS token theft).

    On success:
    - Returns (user, validated_token)
    - Attaches SecurityContext to request.security_context
    """

    def authenticate(self, request: Request) -> tuple[User, Any] | None:
        cookie_name = getattr(settings, "JWT_AUTH_COOKIE", "yss_access")
        raw_token = request.COOKIES.get(cookie_name)

        if raw_token is None:
            # No cookie → unauthenticated (public endpoint or missing cookie)
            return None

        try:
            validated_token = self.get_validated_token(raw_token)
        except TokenError as e:
            logger.warning(
                "JWT validation failed",
                extra={
                    "error": str(e),
                    "correlation_id": getattr(request, "correlation_id", "unknown"),
                },
            )
            from apps.platform.core_exceptions import TokenInvalidError
            raise AuthenticationFailed(str(e))

        # Validate token type
        token_type = validated_token.get("token_type", "")
        if token_type != "access":
            raise AuthenticationFailed("Invalid token type. Expected access token.")

        user = self.get_user(validated_token)

        # Build SecurityContext from token claims
        security_ctx = self._build_security_context(
            user=user,
            token=validated_token,
            request=request,
        )

        # Attach to request for downstream use
        request.security_context = security_ctx  # type: ignore[attr-defined]

        return user, validated_token

    def _build_security_context(
        self,
        user: User,
        token: AccessToken,
        request: Request,
    ) -> SecurityContext:
        """Build immutable SecurityContext from JWT claims."""
        correlation_id = getattr(request, "correlation_id", str(uuid.uuid4()))
        
        # B27: Extract from header, validate against active memberships
        business_unit_id_str = request.headers.get("X-Business-Unit-Id") or None
        business_unit_id = None

        if business_unit_id_str:
            try:
                business_unit_id = uuid.UUID(business_unit_id_str)
            except ValueError:
                raise AuthenticationFailed("Invalid Business Unit ID format.")

            from apps.organization.selectors.user_business_unit_selectors import is_user_member
            if not getattr(user, "is_super_admin", False) and not is_user_member(user.id, business_unit_id):
                raise AuthenticationFailed("Invalid, suspended, or expired Business Unit context.")

            # Load permissions dynamically from cache/database if BU is valid
            from apps.iam.services.permission_service import PermissionService
            permissions_list = PermissionService.get_user_permissions(user.id, business_unit_id)
        else:
            permissions_list = token.get("permissions", [])

        # Role from token (per BU)
        role_id_str: str | None = token.get("role_id")
        role_id = uuid.UUID(role_id_str) if role_id_str else None

        return SecurityContext(
            user_id=user.id,
            business_unit_id=business_unit_id,
            role_id=role_id,
            permissions=frozenset(permissions_list),
            correlation_id=correlation_id,
            is_super_admin=user.is_super_admin,
            is_impersonating=token.get("is_impersonating", False),
            impersonated_user_id=(
                uuid.UUID(token["impersonated_user_id"])
                if token.get("impersonated_user_id")
                else None
            ),
        )


class APIKeyAuthentication:
    """
    API key authentication for machine-to-machine access.
    Reads X-API-Key header and validates against api_consumer_key records.
    Handled in apps/api_consumer_key/authentication.py — placeholder here.
    """

    def authenticate(self, request: Request) -> None:
        return None  # Implemented in api_consumer_key app
