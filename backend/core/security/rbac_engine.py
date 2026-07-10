# yss_orbit/backend/core/security/rbac_engine.py
"""
YSS Orbit - RBAC Engine
Core logic for Role-Based Access Control resolution.
"""
from __future__ import annotations

import logging
from typing import List, Set
from apps.iam.models import User
from apps.iam.services.rbac_service import RBACService

logger = logging.getLogger(__name__)


class RBACEngine:
    """
    Engine to resolve and evaluate user permissions based on their assigned roles.
    """

    @staticmethod
    def get_user_permissions(user: User, tenant_id: str = None) -> Set[str]:
        """
        Calculates the effective permissions for a user.
        If tenant_id is provided, calculates permissions specific to that tenant.
        Otherwise, calculates global/platform permissions.
        """
        if getattr(user, "is_super_admin", False):
            return {"*"}

        permissions = set()

        if tenant_id:
            # Delegate to the RBACService for business_unit scope
            frozenset_perms = RBACService.get_user_permissions_as_frozenset(
                user_id=user.id, business_unit_id=tenant_id
            )
            permissions.update(frozenset_perms)

        return permissions

    @staticmethod
    def user_has_permission(user: User, permission_code: str, tenant_id: str = None) -> bool:
        """
        Check if a user has a specific permission.
        """
        user_perms = RBACEngine.get_user_permissions(user, tenant_id)
        if "*" in user_perms:
            return True
            
        return permission_code in user_perms

    @staticmethod
    def user_has_any_permission(user: User, permission_codes: List[str], tenant_id: str = None) -> bool:
        """
        Check if a user has at least one of the specified permissions.
        """
        user_perms = RBACEngine.get_user_permissions(user, tenant_id)
        if "*" in user_perms:
            return True
            
        return bool(user_perms.intersection(permission_codes))
