# yss_orbit\backend\apps\platform_admin\services\break_glass_service.py
import logging
from apps.platform.models.break_glass_log_model import BreakGlassLog

logger = logging.getLogger(__name__)

class BreakGlassService:
    """
    Service to manage emergency tenant access.
    """
    @staticmethod
    def audit_break_glass_access(admin_user, target_tenant_id: int, reason: str):
        logger.warning(f"SECURITY INCIDENT: Super Admin {admin_user.id} accessed tenant {target_tenant_id}. Reason: {reason}")
        return BreakGlassLog.objects.create(
            admin_user=admin_user,
            target_tenant_id=target_tenant_id,
            reason=reason
        )
