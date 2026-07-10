# yss_orbit\backend\apps\security\context.py
"""
YSS Orbit — SecurityContext
Immutable dataclass representing the authenticated identity for a request.
NEVER stored in thread-locals. Always passed explicitly as a parameter.
"""
from __future__ import annotations

import uuid
from dataclasses import dataclass, field
from functools import cached_property
from typing import FrozenSet


@dataclass(frozen=True)
class SecurityContext:
    """
    Immutable representation of the authenticated identity for one request.

    Architecture rules:
    - Created once by CookieJWTAuthentication after token validation
    - Attached to request.security_context
    - Passed explicitly to service layer — never via thread-local
    - Frozen → thread-safe → no mutation possible
    - permissions is a frozenset → O(1) lookups

    Fields:
        user_id:              Authenticated user's UUID
        business_unit_id:     Selected business unit (None for super-admin global ops)
        role_id:              User's role in this business unit
        permissions:          Frozenset of permission codes for fast O(1) lookup
        correlation_id:       Request correlation ID for tracing
        is_super_admin:       True if user is a platform super-admin
        is_impersonating:     True if this is an impersonation session
        impersonated_user_id: Target user being impersonated
        request_id:           Unique ID for this specific request
    """

    user_id: uuid.UUID
    correlation_id: str
    is_super_admin: bool = False
    business_unit_id: uuid.UUID | None = None
    role_id: uuid.UUID | None = None
    permissions: FrozenSet[str] = field(default_factory=frozenset)
    is_impersonating: bool = False
    impersonated_user_id: uuid.UUID | None = None
    request_id: str = field(default_factory=lambda: str(uuid.uuid4()))

    def has_permission(self, permission_code: str) -> bool:
        """O(1) permission check. Super-admins bypass all permission checks."""
        if self.is_super_admin:
            return True
        return permission_code in self.permissions

    def has_any_permission(self, *permission_codes: str) -> bool:
        """True if user has at least one of the specified permissions."""
        if self.is_super_admin:
            return True
        return bool(self.permissions.intersection(permission_codes))

    def has_all_permissions(self, *permission_codes: str) -> bool:
        """True if user has ALL of the specified permissions."""
        if self.is_super_admin:
            return True
        return all(code in self.permissions for code in permission_codes)

    def require_permission(self, permission_code: str) -> None:
        """
        Raises PermissionDeniedException if permission not held.
        Use in service layer after receiving SecurityContext.
        """
        if not self.has_permission(permission_code):
            from apps.platform.core_exceptions import PermissionDeniedException
            raise PermissionDeniedException(
                message=f"Permission '{permission_code}' is required.",
                details={"required_permission": permission_code},
            )

    def require_business_unit(self) -> uuid.UUID:
        """
        Returns business_unit_id or raises MissingBusinessUnitHeaderError.
        Use when an operation requires a BU context.
        """
        if self.business_unit_id is None:
            from apps.platform.core_exceptions import MissingBusinessUnitHeaderError
            raise MissingBusinessUnitHeaderError()
        return self.business_unit_id

    @property
    def effective_business_unit_id(self) -> uuid.UUID | None:
        """Alias for business_unit_id to match convention."""
        return self.business_unit_id

    @cached_property
    def effective_user_id(self) -> uuid.UUID:
        """
        If impersonating: returns the IMPERSONATED user's ID.
        This is what gets recorded in audit logs.
        """
        if self.is_impersonating and self.impersonated_user_id:
            return self.impersonated_user_id
        return self.user_id

    def to_log_dict(self) -> dict[str, str | None]:
        """Serializable dict for structured logging (no sensitive data)."""
        return {
            "user_id": str(self.user_id),
            "business_unit_id": str(self.business_unit_id) if self.business_unit_id else None,
            "role_id": str(self.role_id) if self.role_id else None,
            "is_super_admin": str(self.is_super_admin),
            "is_impersonating": str(self.is_impersonating),
            "correlation_id": self.correlation_id,
        }


# ─── Anonymous Context ───────────────────────────────────────────────────────

ANONYMOUS_CONTEXT = SecurityContext(
    user_id=uuid.UUID("00000000-0000-0000-0000-000000000000"),
    correlation_id="anonymous",
    is_super_admin=False,
    permissions=frozenset(),
)
