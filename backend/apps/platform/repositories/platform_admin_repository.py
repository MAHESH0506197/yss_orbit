# yss_orbit\backend\apps\platform_admin\repositories\platform_admin_repository.py
from apps.platform.models.platform_admin_model import PlatformAdminProfile

class PlatformAdminRepository:
    """
    Data access layer for platform admin entity.
    """
    @staticmethod
    def revoke_super_admin(user_id: int):
        PlatformAdminProfile.objects.filter(user_id=user_id).update(is_super_admin=False)
