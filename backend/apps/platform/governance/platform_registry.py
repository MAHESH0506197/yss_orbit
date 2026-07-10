# yss_orbit\backend\apps\platform\governance\platform_registry.py
class PlatformRegistry:
    """
    Central registry that enforces multi-tenant module isolation.
    Checks whether a specific tenant is licensed/allowed to run a specific module.
    """
    
    @staticmethod
    def is_module_enabled_for_tenant(tenant_id: int, module_code: str) -> bool:
        # Placeholder for dynamic lookup from the TenantModule mapping
        return True
