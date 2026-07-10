# yss_orbit\backend\apps\core\exceptions.py
"""
YSS Orbit — Application Exception Hierarchy
All exceptions are structured with error_code, message, status_code.
The global_exception_handler converts these to standardized API responses.
"""
from __future__ import annotations

import logging
from typing import Any

from rest_framework import status
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import exception_handler

from apps.platform import core_error_codes as ec

logger = logging.getLogger(__name__)


# ─── Base Exception ──────────────────────────────────────────────────────────

class AppException(Exception):
    """Base exception for all YSS Orbit application errors."""

    status_code: int = status.HTTP_500_INTERNAL_SERVER_ERROR
    default_error_code: str = ec.INTERNAL_ERROR
    default_message: str = "An unexpected error occurred."

    def __init__(
        self,
        message: str | None = None,
        error_code: str | None = None,
        details: dict[str, Any] | None = None,
        status_code: int | None = None,
    ) -> None:
        self.message = message or self.default_message
        self.error_code = error_code or self.default_error_code
        self.details = details or {}
        if status_code is not None:
            self.status_code = status_code
        super().__init__(self.message)

    def to_dict(self) -> dict[str, Any]:
        return {
            "success": False,
            "error": {
                "code": self.error_code,
                "message": self.message,
                "details": self.details,
            },
        }


# ─── Auth Exceptions ─────────────────────────────────────────────────────────

class AuthException(AppException):
    status_code = status.HTTP_401_UNAUTHORIZED
    default_error_code = ec.AUTHENTICATION_REQUIRED
    default_message = "Authentication failed."


class InvalidCredentialsError(AuthException):
    """Steps 1-4 of login — intentionally generic message."""
    default_error_code = ec.INVALID_CREDENTIALS
    default_message = "Invalid username or password."


class AccountLockedError(AuthException):
    status_code = status.HTTP_403_FORBIDDEN
    default_error_code = ec.ACCOUNT_LOCKED
    default_message = "Account is temporarily locked due to too many failed login attempts."


class AccountInactiveError(AuthException):
    status_code = status.HTTP_403_FORBIDDEN
    default_error_code = ec.ACCOUNT_INACTIVE
    default_message = "Account is inactive. Please contact support."


class EmailNotVerifiedError(AuthException):
    status_code = status.HTTP_403_FORBIDDEN
    default_error_code = ec.EMAIL_NOT_VERIFIED
    default_message = "Email address is not verified."


class MFARequiredError(AuthException):
    status_code = status.HTTP_403_FORBIDDEN
    default_error_code = ec.MFA_REQUIRED
    default_message = "Multi-factor authentication is required."


class MFAInvalidError(AuthException):
    status_code = status.HTTP_401_UNAUTHORIZED
    default_error_code = ec.MFA_INVALID
    default_message = "Invalid MFA code."


class OTPInvalidError(AuthException):
    status_code = status.HTTP_401_UNAUTHORIZED
    default_error_code = ec.OTP_INVALID
    default_message = "Invalid OTP."


class OTPExpiredError(AuthException):
    status_code = status.HTTP_401_UNAUTHORIZED
    default_error_code = ec.OTP_EXPIRED
    default_message = "OTP has expired. Please request a new one."


class OTPMaxAttemptsError(AuthException):
    status_code = status.HTTP_429_TOO_MANY_REQUESTS
    default_error_code = ec.OTP_MAX_ATTEMPTS_EXCEEDED
    default_message = "Maximum OTP attempts exceeded. Please request a new OTP."


class OTPRateLimitError(AuthException):
    status_code = status.HTTP_429_TOO_MANY_REQUESTS
    default_error_code = ec.RATE_LIMIT_EXCEEDED
    default_message = "Too many OTP requests. Please wait before requesting another."


class TokenExpiredError(AuthException):
    default_error_code = ec.TOKEN_EXPIRED
    default_message = "Authentication token has expired."


class TokenInvalidError(AuthException):
    status_code = status.HTTP_401_UNAUTHORIZED
    default_error_code = ec.TOKEN_INVALID
    default_message = "Authentication token is invalid."


class SessionRevokedError(AuthException):
    status_code = status.HTTP_401_UNAUTHORIZED
    default_error_code = ec.SESSION_EXPIRED
    default_message = "Session has been revoked. Please log in again."


class ResetTokenError(AuthException):
    status_code = status.HTTP_400_BAD_REQUEST
    default_error_code = ec.RESET_TOKEN_INVALID
    default_message = "Password reset token is invalid or expired."


class InvitationTokenError(AuthException):
    status_code = status.HTTP_400_BAD_REQUEST
    default_error_code = ec.INVALID_FIELD_VALUE
    default_message = "Invitation token is invalid or expired."


# ─── Permission / Access Exceptions ─────────────────────────────────────────

class PermissionDeniedException(AppException):
    status_code = status.HTTP_403_FORBIDDEN
    default_error_code = ec.PERMISSION_DENIED
    default_message = "You do not have permission to perform this action."


class TenantViolationException(AppException):
    """Raised when cross-tenant data access is attempted — logged as security alert."""
    status_code = status.HTTP_403_FORBIDDEN
    default_error_code = ec.CROSS_TENANT_ACCESS_DENIED
    default_message = "Access denied."

    def __init__(self, *args: Any, **kwargs: Any) -> None:
        super().__init__(*args, **kwargs)
        # Always log cross-tenant attempts at ERROR level
        logger.error(
            "SECURITY: Cross-tenant access attempt blocked",
            extra={
                "error_code": self.error_code,
                "details": self.details,
            },
        )


class BusinessUnitNotFoundError(AppException):
    status_code = status.HTTP_403_FORBIDDEN
    default_error_code = ec.BUSINESS_UNIT_NOT_FOUND
    default_message = "Business unit not found or access denied."


class BusinessUnitMembershipError(AppException):
    status_code = status.HTTP_403_FORBIDDEN
    default_error_code = ec.BUSINESS_UNIT_ACCESS_DENIED
    default_message = "You are not a member of this business unit."


class MissingBusinessUnitHeaderError(AppException):
    status_code = status.HTTP_400_BAD_REQUEST
    default_error_code = ec.MISSING_REQUIRED_FIELD
    default_message = "X-Business-Unit-Id header is required for this endpoint."


# ─── Validation Exceptions ───────────────────────────────────────────────────

class ValidationException(AppException):
    """Raised for validation errors. Includes field-level errors."""
    status_code = status.HTTP_400_BAD_REQUEST
    default_error_code = ec.VALIDATION_ERROR
    default_message = "Validation failed."

    def __init__(
        self,
        message: str | None = None,
        field_errors: dict[str, list[str]] | None = None,
        error_code: str | None = None,
    ) -> None:
        details = {"field_errors": field_errors or {}}
        super().__init__(message=message, error_code=error_code, details=details)
        self.field_errors = field_errors or {}


class DuplicateValueError(ValidationException):
    default_error_code = ec.DUPLICATE_ENTRY
    default_message = "A record with this value already exists."


class ReferentialIntegrityError(ValidationException):
    default_error_code = ec.BUSINESS_RULE_VIOLATION
    default_message = "Cannot perform this operation due to related data dependencies."


# ─── Resource Exceptions ─────────────────────────────────────────────────────

class ResourceNotFoundException(AppException):
    status_code = status.HTTP_404_NOT_FOUND
    default_error_code = ec.NOT_FOUND
    default_message = "The requested resource was not found."

    def __init__(self, resource_name: str = "Resource", **kwargs: Any) -> None:
        super().__init__(
            message=f"{resource_name} not found.",
            **kwargs,
        )


class ConflictException(AppException):
    status_code = status.HTTP_409_CONFLICT
    default_error_code = ec.CONFLICT
    default_message = "Request conflicts with current state of the resource."


class OptimisticLockError(ConflictException):
    default_error_code = ec.CONFLICT
    default_message = "Resource was modified by another request. Please retry."


# ─── Plan / Module Exceptions ─────────────────────────────────────────────────

class PlanLimitException(AppException):
    status_code = status.HTTP_402_PAYMENT_REQUIRED
    default_error_code = ec.PLAN_LIMIT_EXCEEDED
    default_message = "Plan limit reached. Please upgrade your subscription."


class ModuleNotSubscribedException(AppException):
    status_code = status.HTTP_403_FORBIDDEN
    default_error_code = ec.MODULE_NOT_SUBSCRIBED
    default_message = "This feature requires a module subscription. Please contact your administrator."


class ModuleDeprecatedException(AppException):
    status_code = status.HTTP_410_GONE
    default_error_code = ec.INVALID_STATE_TRANSITION
    default_message = "This module is deprecated and will be removed in a future release."


# ─── Business Rule Exceptions ─────────────────────────────────────────────────

class InsufficientStockError(AppException):
    status_code = status.HTTP_409_CONFLICT
    default_error_code = ec.BUSINESS_RULE_VIOLATION
    default_message = "Insufficient stock. Stock cannot go negative."


class PayrollAlreadyProcessedError(ConflictException):
    default_error_code = ec.BUSINESS_RULE_VIOLATION
    default_message = "Payroll for this period has already been processed."


class AttendancePeriodFinalizedError(ConflictException):
    default_error_code = ec.BUSINESS_RULE_VIOLATION
    default_message = "Attendance period is finalized and cannot be modified."


class OrchestratorCompensationError(AppException):
    """Raised when orchestrator compensation is triggered (step failed + rollback)."""
    status_code = status.HTTP_500_INTERNAL_SERVER_ERROR
    default_error_code = ec.INTERNAL_ERROR
    default_message = "Operation failed and has been rolled back. Please try again."


# ─── External Service Exceptions ──────────────────────────────────────────────

class ExternalServiceException(AppException):
    status_code = status.HTTP_503_SERVICE_UNAVAILABLE
    default_error_code = ec.SERVICE_UNAVAILABLE
    default_message = "External service is currently unavailable. Please try again shortly."


class CircuitOpenException(ExternalServiceException):
    default_error_code = ec.SERVICE_UNAVAILABLE
    default_message = "Service is temporarily unavailable due to repeated failures."


class PaymentGatewayError(ExternalServiceException):
    default_error_code = ec.SERVICE_UNAVAILABLE
    default_message = "Payment gateway error. Please try again."


# ─── Rate Limit Exceptions ────────────────────────────────────────────────────

class RateLimitExceededException(AppException):
    status_code = status.HTTP_429_TOO_MANY_REQUESTS
    default_error_code = ec.RATE_LIMIT_EXCEEDED
    default_message = "Rate limit exceeded. Please slow down your requests."


class IPRateLimitExceededException(RateLimitExceededException):
    default_error_code = ec.RATE_LIMIT_EXCEEDED
    default_message = "Too many requests from this IP address."


# ─── File Exceptions ─────────────────────────────────────────────────────────

class FileTooLargeError(ValidationException):
    default_error_code = ec.FILE_TOO_LARGE
    default_message = "File exceeds the maximum allowed size."


class FileTypeNotAllowedError(ValidationException):
    default_error_code = ec.FILE_TYPE_NOT_ALLOWED
    default_message = "File type is not allowed."


class VirusDetectedError(AppException):
    status_code = status.HTTP_422_UNPROCESSABLE_ENTITY
    default_error_code = ec.INVALID_FIELD_VALUE
    default_message = "The uploaded file failed security scanning and was rejected."


# ─── Idempotency ─────────────────────────────────────────────────────────────

class IdempotencyConflictError(ConflictException):
    default_error_code = ec.CONFLICT
    default_message = "Idempotency key conflict: same key used with different request payload."


# ─── Global DRF Exception Handler ────────────────────────────────────────────

def global_exception_handler(exc: Exception, context: dict[str, Any]) -> Response | None:
    """
    Global DRF exception handler.
    Converts AppException subclasses to standardized JSON responses.
    Falls back to default DRF handler for DRF native exceptions.
    """
    import uuid
    request: Request = context.get("request")
    correlation_id = getattr(request, "correlation_id", "unknown") if request else "unknown"
    trace_id = getattr(request, "trace_id", str(uuid.uuid4())) if request else str(uuid.uuid4())

    # Handle our custom exceptions
    if isinstance(exc, AppException):
        log_level = logging.ERROR if exc.status_code >= 500 else logging.WARNING
        logger.log(
            log_level,
            "Application exception: %s",
            exc.message,
            extra={
                "error_code": exc.error_code,
                "status_code": exc.status_code,
                "correlation_id": correlation_id,
                "details": exc.details,
            },
        )

        response_data = exc.to_dict()
        response_data["meta"] = {
            "trace_id": trace_id,
            "correlation_id": correlation_id,
        }

        response = Response(response_data, status=exc.status_code)
        response["X-Correlation-Id"] = correlation_id
        return response

    # Delegate to DRF's default handler for DRF exceptions (400, 401, 403, 405)
    drf_response = exception_handler(exc, context)

    if drf_response is not None:
        # Wrap in our standard format
        drf_response.data = {
            "success": False,
            "error": {
                "code": ec.VALIDATION_ERROR if drf_response.status_code == 400 else ec.PERMISSION_DENIED,
                "message": "Request failed.",
                "details": drf_response.data,
            },
            "meta": {
                "trace_id": trace_id,
                "correlation_id": correlation_id
            },
        }
        drf_response["X-Correlation-Id"] = correlation_id
        return drf_response

    # Unhandled exception — log and return 500
    logger.exception(
        "Unhandled exception",
        extra={"correlation_id": correlation_id},
        exc_info=exc,
    )
    response = Response(
        {
            "success": False,
            "error": {
                "code": ec.INTERNAL_ERROR,
                "message": "An unexpected error occurred.",
                "details": {},
            },
            "meta": {
                "trace_id": trace_id,
                "correlation_id": correlation_id
            },
        },
        status=status.HTTP_500_INTERNAL_SERVER_ERROR,
    )
    response["X-Correlation-Id"] = correlation_id
    return response
