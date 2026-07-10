# yss_orbit\backend\apps\platform_admin\orchestrators\platform_admin_orchestrator.py
from apps.platform.models.platform_admin_model import PlatformAdminProfile

class PlatformAdminOrchestrator:
    """
    High-level flow control for platform administration actions.
    """
    @staticmethod
    def provision_super_admin(user_id: int) -> PlatformAdminProfile:
        profile, created = PlatformAdminProfile.objects.get_or_create(
            user_id=user_id,
            defaults={'is_super_admin': True, 'security_clearance_level': 5}
        )
        return profile
