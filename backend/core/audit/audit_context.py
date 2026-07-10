# yss_orbit\backend\core\audit\audit_context.py
"""
Context manager for tracking audit trails during a request lifecycle.
"""
from typing import Dict, Any, Optional
from contextvars import ContextVar

_audit_context: ContextVar[Dict[str, Any]] = ContextVar("audit_context", default={})

def get_audit_context() -> Dict[str, Any]:
    return _audit_context.get().copy()

def set_audit_context(
    user_id: Optional[str] = None,
    tenant_id: Optional[str] = None,
    ip_address: Optional[str] = None,
    user_agent: Optional[str] = None
) -> None:
    ctx = _audit_context.get().copy()
    if user_id:
        ctx["user_id"] = user_id
    if tenant_id:
        ctx["tenant_id"] = tenant_id
    if ip_address:
        ctx["ip_address"] = ip_address
    if user_agent:
        ctx["user_agent"] = user_agent
    _audit_context.set(ctx)

def clear_audit_context() -> None:
    _audit_context.set({})
