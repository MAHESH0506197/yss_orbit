# yss_orbit\backend\apps\users\api\views\auth_views.py
"""
YSS Orbit — Auth API Views
All 7-step login flow, OTP, token refresh, logout, password management.
Tokens delivered ONLY via HttpOnly cookies — NEVER in response body.
"""
from __future__ import annotations

import logging

from django.middleware.csrf import get_token
from django.views.decorators.csrf import csrf_exempt
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response

from apps.platform.core_response import created_response, error_response, no_content_response, success_response
from apps.platform import core_error_codes as ec
from apps.platform.core_exceptions import (
    AccountLockedError, EmailNotVerifiedError, InvalidCredentialsError,
    MFARequiredError, OTPExpiredError, OTPInvalidError, OTPMaxAttemptsError,
    OTPRateLimitError, ResetTokenError, SessionRevokedError, TokenInvalidError,
)
from apps.iam.models import OTPPurpose
from core.auth.authentication_backend import AuthService, LoginStatus
from apps.iam.services.otp_service import OTPService
from core.auth.jwt_handler import TokenService

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# CSRF Init
# ---------------------------------------------------------------------------

@api_view(["GET", "POST"])
@permission_classes([AllowAny])
def csrf_init(request: Request) -> Response:
    """
    Sets CSRF cookie. Frontend must call this before any POST.
    GET /api/init/
    """
    get_token(request)  # Sets csrftoken cookie
    return success_response(
        data={"csrf_initialized": True},
        request=request,
    )


# ---------------------------------------------------------------------------
# Login
# ---------------------------------------------------------------------------

@api_view(["POST"])
@permission_classes([AllowAny])
def login_view(request: Request) -> Response:
    """
    POST /api/v1/auth/login/
    Body: { username, password }

    7-step login flow. Returns status:
    - AUTHENTICATED: Tokens set in cookies
    - EMAIL_VERIFICATION_REQUIRED: OTP sent
    - MFA_REQUIRED: OTP/TOTP required
    """
    correlation_id = getattr(request, "correlation_id", "unknown")

    username = request.data.get("username", "").strip()
    password = request.data.get("password", "")

    if not username or not password:
        return error_response(
            error_code=ec.MISSING_REQUIRED_FIELD,
            message="Username and password are required.",
            http_status=status.HTTP_400_BAD_REQUEST,
            request=request,
        )

    try:
        result = AuthService.login(
            username=username,
            password=password,
            ip_address=_get_ip(request),
            user_agent=request.META.get("HTTP_USER_AGENT", ""),
            correlation_id=correlation_id,
        )
    except (InvalidCredentialsError, AccountLockedError) as e:
        return error_response(
            error_code=e.error_code,
            message=e.message,
            http_status=e.status_code,
            request=request,
        )

    if result.status == LoginStatus.EMAIL_VERIFICATION_REQUIRED:
        # Send email OTP
        try:
            _send_otp(result.user_id, OTPPurpose.EMAIL_VERIFICATION, result.email, username, correlation_id)
        except OTPRateLimitError as e:
            return error_response(
                error_code=e.error_code,
                message=e.message,
                http_status=e.status_code,
                request=request,
            )

        # Store pending state in pendingAuthStore (frontend sessionStorage)
        return success_response(
            data={
                "status": result.status.value,
                "pending_user_id": str(result.user_id),
                "email_masked": _mask_email(result.email),
                "purpose": OTPPurpose.EMAIL_VERIFICATION,
            },
            http_status=status.HTTP_200_OK,
            request=request,
        )

    if result.status == LoginStatus.MFA_REQUIRED:
        # Send MFA OTP
        try:
            _send_otp(result.user_id, OTPPurpose.MFA, result.email, username, correlation_id)
        except OTPRateLimitError as e:
            return error_response(
                error_code=e.error_code,
                message=e.message,
                http_status=e.status_code,
                request=request,
            )

        return success_response(
            data={
                "status": "MFA_OTP_SENT",
                "pending_user_id": str(result.user_id),
                "email_masked": _mask_email(result.email),
                "purpose": "LOGIN_MFA",  # Keep this string as LOGIN_MFA for the frontend to match
            },
            http_status=status.HTTP_200_OK,
            request=request,
        )

    # AUTHENTICATED - set cookies
    from apps.iam.models.user import User
    user = User.objects.get(id=result.user_id)

    user.record_login(ip_address=_get_ip(request))

    from apps.compliance.services.audit_service import log_action, AuditLog
    log_action(
        action=AuditLog.Action.LOGIN,
        resource_type="iam.User",
        user_id=user.id,
        user_username=user.username,
        resource_id=user.id,
        resource_display=user.username,
        ip_address=_get_ip(request),
        user_agent=request.META.get("HTTP_USER_AGENT", ""),
        correlation_id=correlation_id,
        endpoint="/api/v1/auth/login/",
        http_method="POST",
    )

    # FIX-BUG17: Extract permissions from the freshly-issued access token
    # (claim populated by TokenService._load_platform_permissions, FIX-BUG14).
    # Without this, login_view returned no "permissions" key at all (unlike
    # me_view), leaving frontend authStore.permissions = [] until the next
    # /auth/me/ call on page refresh — first-paint after login showed zero
    # permission-gated UI for non-super-admins.
    from rest_framework_simplejwt.tokens import AccessToken
    permissions: list = []
    try:
        permissions = AccessToken(result.access_token).get("permissions", [])
    except Exception:
        logger.warning(
            "Could not extract permissions claim from freshly-issued access token",
            extra={"correlation_id": correlation_id, "user_id": str(user.id)},
        )

    response = success_response(
        data={
            "status": result.status.value,
            "user_id": str(user.id),
            "username": user.username,
            "email": user.email,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "timezone": user.timezone,
            "language": user.language,
            "avatar": user.avatar.url if user.avatar else None,
            "is_super_admin": user.is_super_admin,
            "permissions": permissions,
            "allowed_business_units": result.allowed_business_units or [],
        },
        request=request,
    )
    TokenService.set_cookies(response, result.access_token, result.refresh_token)
    return response


# ---------------------------------------------------------------------------
# Session Restore (Me)
# ---------------------------------------------------------------------------

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def me_view(request: Request) -> Response:
    """
    GET /api/v1/auth/me/
    Returns current user profile + permissions + real BU list to restore session on page refresh.
    H-1 fix: B06 §5.19 — allowed_business_units MUST be populated from DB, not hardcoded [].
    Frontend calls this on every page refresh; returning [] blocked BU selection for the entire platform.
    """
    from apps.organization.models.user_business_unit_model import UserBusinessUnitModel

    user = request.user
    # Load permissions from the auth token payload
    permissions = []
    if request.auth and hasattr(request.auth, "get"):
        permissions = request.auth.get("permissions", [])

    # H-1 fix: Query real BU memberships from the canonical ubu_memberships table.
    # B06 §5.19: allowed_business_units contract = [{id, name, code}].
    # B01 §5.5: Only active, non-deleted memberships are included.
    allowed_business_units = []
    if getattr(user, "is_super_admin", False):
        from apps.organization.models import BusinessUnit
        all_bus = BusinessUnit.objects.filter(is_active=True, is_deleted=False).only("id", "name", "code")
        allowed_business_units = [
            {"id": str(bu.id), "name": bu.name, "code": bu.code}
            for bu in all_bus
        ]
    else:
        memberships = (
            UserBusinessUnitModel.objects
            .filter(
                user_id=user.id,
                is_active=True,
                is_deleted=False,
                is_active_membership=True,
            )
            .select_related("business_unit")
            .only(
                "business_unit__id",
                "business_unit__name",
                "business_unit__code",
            )
        )
        allowed_business_units = [
            {
                "id": str(m.business_unit.id),
                "name": m.business_unit.name,
                "code": m.business_unit.code,
            }
            for m in memberships
        ]

    return success_response(
        data={
            "user_id": str(user.id),
            "username": user.username,
            "email": user.email,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "timezone": user.timezone,
            "language": user.language,
            "avatar": user.avatar.url if user.avatar else None,
            "is_super_admin": user.is_super_admin,
            "permissions": permissions,
            # B06 §5.19: real BU list from DB — super admins get empty list
            # (frontend grants them full access based on is_super_admin flag)
            "allowed_business_units": allowed_business_units,
        },
        request=request,
    )

# ---------------------------------------------------------------------------
# Logout
# ---------------------------------------------------------------------------

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def logout_view(request: Request) -> Response:
    """
    POST /api/v1/auth/logout/
    Clears JWT cookies and revokes session.
    """
    from rest_framework_simplejwt.tokens import RefreshToken

    correlation_id = getattr(request, "correlation_id", "unknown")

    # Revoke refresh token if present
    refresh_cookie = request.COOKIES.get("yss_refresh") or request.COOKIES.get("__Host-yss_refresh")
    if refresh_cookie:
        try:
            token = RefreshToken(refresh_cookie)
            TokenService.revoke_session(str(token["jti"]))
        except Exception:
            pass  # Already invalid — that's fine

    response = success_response(
        data={"message": "Logged out successfully."},
        request=request,
    )
    TokenService.clear_cookies(response)
    return response


# ---------------------------------------------------------------------------
# Token Refresh
# ---------------------------------------------------------------------------

@api_view(["POST"])
@permission_classes([AllowAny])
def token_refresh_view(request: Request) -> Response:
    """
    POST /api/v1/auth/token/refresh/
    Rotates refresh token. Reuse detection → revoke all sessions.
    """
    correlation_id = getattr(request, "correlation_id", "unknown")

    refresh_token = (
        request.COOKIES.get("yss_refresh")
        or request.COOKIES.get("__Host-yss_refresh")
    )

    if not refresh_token:
        return error_response(
            error_code=ec.MISSING_REQUIRED_FIELD,
            message="No refresh token provided.",
            http_status=status.HTTP_401_UNAUTHORIZED,
            request=request,
        )

    try:
        new_access, new_refresh = TokenService.refresh_tokens(
            refresh_token_str=refresh_token,
            correlation_id=correlation_id,
        )
    except (SessionRevokedError, TokenInvalidError) as e:
        response = error_response(
            error_code=e.error_code,
            message=e.message,
            http_status=e.status_code,
            request=request,
        )
        TokenService.clear_cookies(response)
        return response

    response = success_response(
        data={"refreshed": True},
        request=request,
    )
    TokenService.set_cookies(response, new_access, new_refresh)
    return response


# ---------------------------------------------------------------------------
# OTP Verify
# ---------------------------------------------------------------------------

@api_view(["POST"])
@permission_classes([AllowAny])
def otp_verify_view(request: Request) -> Response:
    """
    POST /api/v1/auth/otp/verify/
    Body: { user_id, otp, purpose }
    """
    import uuid
    from django.conf import settings

    correlation_id = getattr(request, "correlation_id", "unknown")
    user_id_str = request.data.get("user_id", "")
    username = request.data.get("username", "").strip()
    otp_code = request.data.get("otp", "")
    purpose = request.data.get("purpose", "")

    if not (user_id_str or username) or not otp_code or not purpose:
        return error_response(
            error_code=ec.MISSING_REQUIRED_FIELD,
            message="user_id (or username), otp, and purpose are required.",
            http_status=status.HTTP_400_BAD_REQUEST,
            request=request,
        )

    if purpose == "LOGIN_MFA":
        purpose = OTPPurpose.MFA

    if username and not user_id_str:
        from apps.iam.models import User
        try:
            user = User.objects.get(username=username, is_deleted=False)
            user_id = user.id
        except User.DoesNotExist:
            return error_response(
                error_code=ec.NOT_FOUND,
                message="User not found.",
                http_status=status.HTTP_404_NOT_FOUND,
                request=request,
            )
    else:
        try:
            user_id = uuid.UUID(user_id_str)
        except ValueError:
            return error_response(
                error_code=ec.INVALID_FIELD_VALUE,
                message="Invalid user_id format.",
                http_status=status.HTTP_400_BAD_REQUEST,
                request=request,
            )

    try:
        OTPService.verify(
            user_id=user_id,
            otp_plaintext=otp_code,
            purpose=purpose,
            correlation_id=correlation_id,
            mark_used=(purpose != OTPPurpose.PASSWORD_RESET),
        )
    except (OTPInvalidError, OTPExpiredError, OTPMaxAttemptsError) as e:
        return error_response(
            error_code=e.error_code,
            message=e.message,
            http_status=e.status_code,
            request=request,
        )

    # OTP verified — now handle purpose-specific post-actions
    from apps.iam.models import User

    try:
        user = User.objects.get(id=user_id, is_deleted=False)
    except User.DoesNotExist:
        return error_response(
            error_code=ec.NOT_FOUND,
            message="User not found.",
            http_status=status.HTTP_404_NOT_FOUND,
            request=request,
        )

    if purpose == OTPPurpose.EMAIL_VERIFICATION:
        user.is_email_verified = True
        user.save(update_fields=["is_email_verified", "updated_at"])
        # Now issue tokens (complete login flow)
        access, refresh, session_id = TokenService.issue_tokens(
            user=user,
            ip_address=_get_ip(request),
            user_agent=request.META.get("HTTP_USER_AGENT", ""),
            correlation_id=correlation_id,
        )
        user.record_login(ip_address=_get_ip(request))
        allowed_bus = AuthService._get_user_business_units(user.id)

        from apps.platform.services.email_service import EmailService
        EmailService.send_email_verified_email(user.email, user.first_name)

        response = success_response(
            data={
                "status": "AUTHENTICATED",
                "user": {"id": str(user.id), "username": user.username},
                "allowed_business_units": allowed_bus,
            },
            request=request,
        )
        TokenService.set_cookies(response, access, refresh)
        return response

    elif purpose == OTPPurpose.MFA:
        access, refresh, _ = TokenService.issue_tokens(
            user=user,
            ip_address=_get_ip(request),
            user_agent=request.META.get("HTTP_USER_AGENT", ""),
            correlation_id=correlation_id,
        )
        user.record_login(ip_address=_get_ip(request))
        allowed_bus = AuthService._get_user_business_units(user.id)
        response = success_response(
            data={
                "status": "AUTHENTICATED",
                "user": {"id": str(user.id), "username": user.username},
                "allowed_business_units": allowed_bus,
            },
            request=request,
        )
        TokenService.set_cookies(response, access, refresh)
        return response

    elif purpose == OTPPurpose.PASSWORD_RESET:
        return success_response(
            data={"status": "OTP_VERIFIED", "purpose": purpose},
            request=request,
        )

    elif purpose == OTPPurpose.ACCOUNT_UNLOCK:
        user.reset_failed_attempts()
        return success_response(
            data={"status": "ACCOUNT_UNLOCKED", "message": "Account unlocked successfully. You can now log in."},
            request=request,
        )

    return success_response(
        data={"status": "OTP_VERIFIED", "purpose": purpose},
        request=request,
    )


# ---------------------------------------------------------------------------
# OTP Resend
# ---------------------------------------------------------------------------

@api_view(["POST"])
@permission_classes([AllowAny])
def otp_resend_view(request: Request) -> Response:
    """
    POST /api/v1/auth/otp/resend/
    Body: { user_id, purpose }
    """
    import uuid

    correlation_id = getattr(request, "correlation_id", "unknown")
    user_id_str = request.data.get("user_id", "")
    purpose = request.data.get("purpose", "")

    if not user_id_str or not purpose:
        return error_response(
            error_code=ec.MISSING_REQUIRED_FIELD,
            message="user_id and purpose are required.",
            http_status=status.HTTP_400_BAD_REQUEST,
            request=request,
        )

    try:
        user_id = uuid.UUID(user_id_str)
        user = __import__("apps.iam.models", fromlist=["User"]).User.objects.get(
            id=user_id, is_deleted=False
        )
    except (ValueError, Exception):
        return error_response(
            error_code=ec.INVALID_FIELD_VALUE,
            message="Invalid request.",
            http_status=status.HTTP_400_BAD_REQUEST,
            request=request,
        )

    try:
        _send_otp(user_id, purpose, user.email, user.username, correlation_id)
    except OTPRateLimitError as e:
        return error_response(
            error_code=e.error_code,
            message=e.message,
            http_status=e.status_code,
            request=request,
        )

    return success_response(
        data={"sent": True, "email_masked": _mask_email(user.email)},
        request=request,
    )


# ---------------------------------------------------------------------------
# Password Forgot
# ---------------------------------------------------------------------------

@api_view(["POST"])
@permission_classes([AllowAny])
def password_forgot_view(request: Request) -> Response:
    """
    POST /api/v1/auth/password/forgot/
    Body: { username }
    Always returns 200 to prevent user enumeration.
    """
    from apps.iam.models import User

    correlation_id = getattr(request, "correlation_id", "unknown")
    username = request.data.get("username", "").strip()

    if username:
        try:
            user = User.objects.get(username=username, is_deleted=False, is_active=True)
            _send_otp(user.id, OTPPurpose.PASSWORD_RESET, user.email, user.username, correlation_id)
        except User.DoesNotExist:
            pass  # Silent - prevent user enumeration
        except OTPRateLimitError:
            pass  # Silent - prevent rate limit enumeration

    # Always return 200 with generic message
    return success_response(
        data={"message": "If an account with that username exists, a password reset code has been sent to its registered email."},
        request=request,
    )


# ---------------------------------------------------------------------------
# Password Reset
# ---------------------------------------------------------------------------

@api_view(["POST"])
@permission_classes([AllowAny])
def password_reset_view(request: Request) -> Response:
    """
    POST /api/v1/auth/password/reset/
    Body: { username, otp, new_password, confirm_password }
    """
    import uuid
    from apps.iam.models import User, PasswordHistory

    correlation_id = getattr(request, "correlation_id", "unknown")
    username = request.data.get("username", "").strip()
    otp_code = request.data.get("otp", "")
    new_password = request.data.get("new_password", "")
    confirm_password = request.data.get("confirm_password", "")

    # Validate input
    if not all([username, otp_code, new_password, confirm_password]):
        return error_response(
            error_code=ec.MISSING_REQUIRED_FIELD,
            message="All fields are required.",
            http_status=status.HTTP_400_BAD_REQUEST,
            request=request,
        )

    if new_password != confirm_password:
        return error_response(
            error_code=ec.INVALID_FIELD_VALUE,
            message="Passwords do not match.",
            http_status=status.HTTP_400_BAD_REQUEST,
            request=request,
        )

    try:
        user = User.objects.get(username=username, is_deleted=False, is_active=True)
    except User.DoesNotExist:
        return error_response(
            error_code=ec.RESET_TOKEN_INVALID,
            message="Invalid reset request.",
            http_status=status.HTTP_400_BAD_REQUEST,
            request=request,
        )

    try:
        OTPService.verify(user.id, otp_code, OTPPurpose.PASSWORD_RESET, correlation_id)
    except (OTPInvalidError, OTPExpiredError, OTPMaxAttemptsError) as e:
        return error_response(error_code=e.error_code, message=e.message, http_status=e.status_code, request=request)

    # Check password same as current
    if user.check_password(new_password):
        return error_response(
            error_code=ec.BUSINESS_RULE_VIOLATION,
            message="New password must be different from your current password.",
            http_status=status.HTTP_400_BAD_REQUEST,
            request=request,
        )

    # Check password history (last 5)
    from django.contrib.auth.hashers import check_password as check_pw
    recent_hashes = PasswordHistory.objects.filter(user=user).order_by("-created_at").values_list("hashed_password", flat=True)[:5]
    for old_hash in recent_hashes:
        if check_pw(new_password, old_hash):
            return error_response(
                error_code=ec.BUSINESS_RULE_VIOLATION,
                message="Password cannot be the same as one of your last 5 passwords.",
                http_status=status.HTTP_400_BAD_REQUEST,
                request=request,
            )

    # Save new password and history
    old_hash = user.password
    user.set_password(new_password)
    from django.utils import timezone
    user.password_changed_at = timezone.now()
    user.save(update_fields=["password", "password_changed_at", "updated_at"])

    PasswordHistory.objects.create(user=user, hashed_password=old_hash)
    # Keep only last 5
    old_records = PasswordHistory.objects.filter(user=user).order_by("-created_at")[5:]
    PasswordHistory.objects.filter(id__in=[r.id for r in old_records]).delete()

    # Reset failed login attempts and unlock account
    user.reset_failed_attempts()

    # Revoke all sessions (forced re-login after password change)
    TokenService.revoke_all_sessions(user.id)

    from apps.platform.services.email_service import EmailService
    EmailService.send_password_reset_alert(user.email, user.first_name)

    return success_response(
        data={"message": "Password changed successfully. Please log in with your new password."},
        request=request,
    )


# ---------------------------------------------------------------------------
# Change Password
# ---------------------------------------------------------------------------

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def password_change_view(request: Request) -> Response:
    """
    POST /api/v1/auth/password/change/
    Body: { old_password, new_password, confirm_password }
    Requires user to be logged in.

    C-4 fix:
      B06 §5.2: MUST check last 5 password history (was missing).
      B06 §5.9: MUST revoke ALL sessions after password change (was missing).
    These checks now match the password_reset_view which already had both.
    """
    from apps.iam.models import PasswordHistory
    from django.contrib.auth.hashers import check_password as check_pw
    from django.utils import timezone as tz

    old_password = request.data.get("old_password", "")
    new_password = request.data.get("new_password", "")
    confirm_password = request.data.get("confirm_password", "")

    if not all([old_password, new_password, confirm_password]):
        return error_response(
            error_code=ec.MISSING_REQUIRED_FIELD,
            message="Old password, new password, and confirm password are required.",
            http_status=status.HTTP_400_BAD_REQUEST,
            request=request,
        )

    if new_password != confirm_password:
        return error_response(
            error_code=ec.INVALID_FIELD_VALUE,
            message="New password and confirm password do not match.",
            http_status=status.HTTP_400_BAD_REQUEST,
            request=request,
        )

    user = request.user

    if not user.check_password(old_password):
        return error_response(
            error_code=ec.INVALID_CREDENTIALS,
            message="Incorrect old password.",
            http_status=status.HTTP_400_BAD_REQUEST,
            request=request,
        )

    if old_password == new_password:
        return error_response(
            error_code=ec.BUSINESS_RULE_VIOLATION,
            message="New password must be different from your current password.",
            http_status=status.HTTP_400_BAD_REQUEST,
            request=request,
        )

    # C-4 fix (B06 §5.2): Check password history — MUST NOT match last 5 passwords.
    # This check was missing; password_reset_view already had it. Now both are consistent.
    recent_hashes = (
        PasswordHistory.objects
        .filter(user=user)
        .order_by("-created_at")
        .values_list("hashed_password", flat=True)[:5]
    )
    for old_hash in recent_hashes:
        if check_pw(new_password, old_hash):
            return error_response(
                error_code=ec.BUSINESS_RULE_VIOLATION,
                message="Password cannot be the same as one of your last 5 passwords.",
                http_status=status.HTTP_400_BAD_REQUEST,
                request=request,
            )

    # Save new password + audit trail
    old_hash = user.password
    user.set_password(new_password)
    user.password_changed_at = tz.now()
    user.save(update_fields=["password", "password_changed_at", "updated_at"])

    # Write to password history; keep only last 5 entries
    PasswordHistory.objects.create(user=user, hashed_password=old_hash)
    old_records = PasswordHistory.objects.filter(user=user).order_by("-created_at")[5:]
    PasswordHistory.objects.filter(id__in=[r.id for r in old_records]).delete()

    # C-4 fix (B06 §5.9): Revoke ALL sessions across ALL devices after password change.
    # This was the critical missing piece — other devices remained logged in after password change.
    TokenService.revoke_all_sessions(user.id)

    return success_response(
        data={"message": "Password changed successfully. All other sessions have been signed out."},
        request=request,
    )


# ---------------------------------------------------------------------------
# Account Unlock Request
# ---------------------------------------------------------------------------

@api_view(["POST"])
@permission_classes([AllowAny])
def account_unlock_request_view(request: Request) -> Response:
    """
    POST /api/v1/auth/unlock/request/
    Body: { username }
    Always returns 200 to prevent user enumeration.
    """
    from apps.iam.models import User

    correlation_id = getattr(request, "correlation_id", "unknown")
    username = request.data.get("username", "").strip()

    if username:
        try:
            user = User.objects.get(username=username, is_deleted=False, is_active=True)
            if user.is_locked():
                _send_otp(user.id, OTPPurpose.ACCOUNT_UNLOCK, user.email, user.username, correlation_id)
        except User.DoesNotExist:
            pass  # Silent
        except OTPRateLimitError:
            pass  # Silent

    return success_response(
        data={"message": "If the account exists and is locked, an unlock code has been sent to its registered email."},
        request=request,
    )

# Helpers
# ---------------------------------------------------------------------------

def _get_ip(request: Request) -> str:
    xff = request.META.get("HTTP_X_FORWARDED_FOR")
    if xff:
        return xff.split(",")[0].strip()
    return request.META.get("REMOTE_ADDR", "0.0.0.0")


def _mask_email(email: str) -> str:
    """Mask email for display: user@example.com → u***@example.com"""
    parts = email.split("@")
    if len(parts) != 2:
        return "****"
    local = parts[0]
    masked = local[0] + "***" if local else "***"
    return f"{masked}@{parts[1]}"


def _send_otp(user_id, purpose, email: str, username: str, correlation_id: str) -> None:
    """Generate OTP and dispatch notification."""
    otp_plaintext = OTPService.generate(user_id, purpose, correlation_id)

    # Send via notification system
    from apps.platform.core_tasks import send_otp_notification
    from django.conf import settings

    kwargs = {
        "user_id": str(user_id),
        "username": username,
        "otp": otp_plaintext,
        "email": email,
        "purpose": purpose,
        "correlation_id": correlation_id,
    }

    if getattr(settings, "CELERY_TASK_ALWAYS_EAGER", False):
        # Run synchronously in development to bypass broker connection checks completely
        send_otp_notification(**kwargs)
    else:
        # Async dispatch for production
        send_otp_notification.delay(**kwargs)
