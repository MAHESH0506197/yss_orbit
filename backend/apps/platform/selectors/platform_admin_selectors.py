# yss_orbit\backend\apps\platform_admin\selectors\platform_admin_selectors.py
from apps.platform.models.platform_admin_model import PlatformAdminProfile

class PlatformAdminSelectors:
    """
    Selector logic for platform admins.
    """
    @staticmethod
    def is_user_super_admin(user_id: int) -> bool:
        return PlatformAdminProfile.objects.filter(user_id=user_id, is_super_admin=True).exists()
