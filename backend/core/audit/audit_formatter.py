# yss_orbit\backend\core\audit\audit_formatter.py
"""
Formatter for audit logs.
"""
from typing import Any, Dict
from core.audit.audit_context import get_audit_context

def format_audit_payload(
    action: str, 
    resource: str, 
    resource_id: str, 
    changes: Dict[str, Any] = None, 
    status: str = "SUCCESS"
) -> Dict[str, Any]:
    """
    Format a standard audit log payload attaching the current context.
    """
    ctx = get_audit_context()
    return {
        "action": action,
        "resource": resource,
        "resource_id": str(resource_id) if resource_id else None,
        "changes": changes or {},
        "status": status,
        "actor_id": ctx.get("user_id", "SYSTEM"),
        "tenant_id": ctx.get("tenant_id", "SYSTEM"),
        "ip_address": ctx.get("ip_address"),
        "user_agent": ctx.get("user_agent"),
    }
