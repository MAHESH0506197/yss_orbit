# yss_orbit\backend\core\tenancy\tenant_context.py
"""
Tenant context management via contextvars.
"""
from typing import Optional, Dict, Any
from contextvars import ContextVar

_tenant_context: ContextVar[Dict[str, Any]] = ContextVar("tenant_context", default={})

def get_tenant_context() -> Dict[str, Any]:
    return _tenant_context.get().copy()

def get_current_tenant_id() -> Optional[str]:
    return _tenant_context.get().get("tenant_id")

def set_tenant_context(tenant_id: str, **kwargs) -> None:
    ctx = {"tenant_id": tenant_id}
    ctx.update(kwargs)
    _tenant_context.set(ctx)

def clear_tenant_context() -> None:
    _tenant_context.set({})
