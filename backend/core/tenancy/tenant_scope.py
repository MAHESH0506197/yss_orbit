# yss_orbit\backend\core\tenancy\tenant_scope.py
"""
Tenant scopes and isolation boundaries.
"""
from typing import Callable, Any
from core.tenancy.tenant_context import get_current_tenant_id
from core.exceptions import CrossTenantViolationException

def enforce_tenant_scope(tenant_id: str) -> None:
    """
    Ensure the requested tenant_id matches the active context.
    Prevents cross-tenant data leaks.
    """
    current_tenant = get_current_tenant_id()
    if not current_tenant:
        raise CrossTenantViolationException("No active tenant context.")
    if str(current_tenant) != str(tenant_id):
        raise CrossTenantViolationException("Cross-tenant data access attempt blocked.")
