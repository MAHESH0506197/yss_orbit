# yss_orbit/backend/apps/rbac/repositories/user_role_repository.py
import uuid
from typing import Optional

from django.db.models import QuerySet
from apps.iam.models.rbac_models import UserRole


class UserRoleRepository:
    """
    Repository for UserRole model.
    Handles data access for user role assignments.
    """

    def get_by_id(self, user_role_id: uuid.UUID) -> Optional[UserRole]:
        return UserRole.objects.filter(id=user_role_id).first()

    def get_active_for_user_in_bu(self, user_id: uuid.UUID, business_unit_id: uuid.UUID) -> QuerySet[UserRole]:
        from apps.organization.selectors.user_business_unit_selectors import get_active_memberships_query
        # Enforce B27 Parent Suspension & Effective Dates
        active_bu_ids = get_active_memberships_query().filter(
            user_id=user_id, business_unit_id=business_unit_id
        ).values_list('business_unit_id', flat=True)

        return UserRole.objects.filter(
            user_id=user_id,
            business_unit_id__in=active_bu_ids,
            is_active=True,
            role__is_deleted=False
        ).select_related('role')

    def get_active_for_user(self, user_id: uuid.UUID) -> QuerySet[UserRole]:
        """
        FIX-BUG14: Returns ALL active role assignments for a user across
        every business unit they belong to. Used by
        RBACService.get_user_permissions_all_bus() to compute the JWT-embedded
        permission superset at token issuance time (before a BU is selected).

        select_related('role') avoids N+1 when callers iterate ur.role.
        """
        from apps.organization.selectors.user_business_unit_selectors import get_active_memberships_query
        # Enforce B27 Parent Suspension & Effective Dates
        active_bu_ids = get_active_memberships_query().filter(user_id=user_id).values_list('business_unit_id', flat=True)

        return UserRole.objects.filter(
            user_id=user_id,
            business_unit_id__in=active_bu_ids,
            is_active=True,
            role__is_deleted=False
        ).select_related('role')

    def create(self, **kwargs) -> UserRole:
        return UserRole.objects.create(**kwargs)

    def update(self, user_role: UserRole, **kwargs) -> UserRole:
        for key, value in kwargs.items():
            setattr(user_role, key, value)
        user_role.save()
        return user_role
