# yss_orbit\backend\core\tenancy\organization_context.py
"""
Organization context.
Organizations can own multiple tenants (Business Units).
"""
from contextvars import ContextVar
from typing import Optional

_org_context: ContextVar[Optional[str]] = ContextVar("org_context", default=None)

def get_current_organization_id() -> Optional[str]:
    return _org_context.get()

def set_organization_context(org_id: str) -> None:
    _org_context.set(org_id)

def clear_organization_context() -> None:
    _org_context.set(None)
