# yss_orbit\backend\core\security\security_context.py
"""
YSS Orbit - Security Context
Thread-local storage for security-related data during a request lifecycle.

3.6 fix: B02 §5.1 — Renamed tenant_id → business_unit_id throughout.
         B03 §5.3 — The multi-tenancy discriminator is business_unit_id, NOT tenant_id.
         E03 §5.2 — Added correlation_id storage for distributed tracing.
"""
from __future__ import annotations

import threading
from typing import Optional

_thread_locals = threading.local()


class SecurityContext:
    """
    Manages security context for the current thread/request.
    Provides ambient access to user, business_unit_id, and correlation_id
    deep in the service layer without explicit parameter passing.

    3.6 fix: B02 §5.1 — Uses business_unit_id (NOT tenant_id).
    """

    @staticmethod
    def set_context(
        user_id: Optional[str] = None,
        business_unit_id: Optional[str] = None,
        correlation_id: Optional[str] = None,
        is_authenticated: bool = False,
        is_superuser: bool = False,
        scopes: Optional[set] = None,
    ) -> None:
        """Set security context for the current request thread."""
        _thread_locals.user_id = user_id
        _thread_locals.business_unit_id = business_unit_id  # 3.6 fix: was tenant_id
        _thread_locals.correlation_id = correlation_id
        _thread_locals.is_authenticated = is_authenticated
        _thread_locals.is_superuser = is_superuser
        _thread_locals.scopes = scopes or set()

    @staticmethod
    def clear_context() -> None:
        """Clear security context at request end (always called in finally block)."""
        for attr in ("user_id", "business_unit_id", "correlation_id",
                     "is_authenticated", "is_superuser", "scopes"):
            _thread_locals.__dict__.pop(attr, None)

    @staticmethod
    def get_current_user_id() -> Optional[str]:
        return getattr(_thread_locals, "user_id", None)

    @staticmethod
    def get_current_business_unit_id() -> Optional[str]:
        """3.6 fix: Returns business_unit_id (was get_current_tenant_id → tenant_id)."""
        return getattr(_thread_locals, "business_unit_id", None)

    @staticmethod
    def get_correlation_id() -> Optional[str]:
        return getattr(_thread_locals, "correlation_id", None)

    @staticmethod
    def is_super_admin() -> bool:
        return getattr(_thread_locals, "is_superuser", False)

    # ── Backward-compat aliases ───────────────────────────────────────────────
    # TODO(PROJ-004): Remove these aliases after all callers are migrated.
    @staticmethod
    def get_current_tenant_id() -> Optional[str]:
        """⚠️ DEPRECATED — use get_current_business_unit_id(). Left for compatibility."""
        return SecurityContext.get_current_business_unit_id()


# Module-level aliases used by middleware
set_security_context = SecurityContext.set_context
clear_security_context = SecurityContext.clear_context
