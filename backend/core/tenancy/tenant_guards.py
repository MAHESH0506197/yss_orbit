# yss_orbit\backend\core\tenancy\tenant_guards.py
"""
Guards to ensure operations are safely contained within a tenant.
"""
from core.tenancy.tenant_context import get_current_tenant_id
from core.exceptions import TenantNotFoundException

class TenantGuard:
    @staticmethod
    def require_tenant() -> str:
        tenant_id = get_current_tenant_id()
        if not tenant_id:
            raise TenantNotFoundException("Operation requires an active tenant context.")
        return tenant_id
