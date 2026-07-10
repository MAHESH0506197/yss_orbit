# yss_orbit/backend/apps/rbac/services/permission_service.py
import logging
import uuid
from typing import List

from apps.iam.services.rbac_service import RBACService

logger = logging.getLogger(__name__)

class PermissionService:
    """
    Enterprise-grade Service for Permission.
    Permissions are system-seeded and immutable.
    """

    @classmethod
    def get_user_permissions(cls, user_id: uuid.UUID, business_unit_id: uuid.UUID) -> List[str]:
        """
        Retrieves active permissions for a user.
        """
        return list(RBACService.get_user_permissions_as_frozenset(user_id, business_unit_id))
