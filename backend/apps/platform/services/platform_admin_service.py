# yss_orbit\backend\apps\platform_admin\services\platform_admin_service.py
from apps.platform.models.platform_admin_model import PlatformAdminProfile

class PlatformAdminService:
    """
    Business logic for Platform Admins.
    """
    @staticmethod
    def promote_to_super_admin(user_id: int):
        from apps.platform.orchestrators.platform_admin_orchestrator import PlatformAdminOrchestrator
        return PlatformAdminOrchestrator.provision_super_admin(user_id)
