# yss_orbit\backend\apps\platform_admin\services\tenant_lifecycle_service.py
import logging

logger = logging.getLogger(__name__)

class TenantLifecycleService:
    """
    Service for platform super-admins to manage tenant states
    (e.g., suspend a tenant due to non-payment).
    """
    @staticmethod
    def suspend_tenant(tenant_id: int, reason: str):
        logger.warning(f"Suspending tenant {tenant_id} - Reason: {reason}")
        from apps.organization.services.organization_service import OrganizationService
        OrganizationService.deactivate_organization(tenant_id)
