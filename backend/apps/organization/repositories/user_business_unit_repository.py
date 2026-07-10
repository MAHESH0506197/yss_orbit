# yss_orbit\backend\apps\user_business_unit\repositories\user_business_unit_repository.py
"""
Repository for UserBusinessUnitModel — encapsulates all DB access.

ENTERPRISE AUDIT FIXES:
  ✅ ISSUE-07: soft_delete() method added — hard delete violated platform soft-delete policy.
  ✅ MED-05:   All methods standardized to @staticmethod for consistency with BusinessUnitRepository.
"""
from __future__ import annotations

import uuid
from typing import List, Optional

from django.db.models import QuerySet

from apps.organization.models.user_business_unit_model import UserBusinessUnitModel


class UserBusinessUnitRepository:
    """
    Data-access layer for UBU memberships.
    All public methods are static — instantiate-free usage mirrors BusinessUnitRepository.
    """

    @staticmethod
    def get_by_id(membership_id: uuid.UUID) -> Optional[UserBusinessUnitModel]:
        return (
            UserBusinessUnitModel.objects
            .select_related("user", "business_unit", "role")
            .filter(id=membership_id)
            .first()
        )

    @staticmethod
    def get_by_id_or_fail(membership_id: uuid.UUID) -> UserBusinessUnitModel:
        try:
            return (
                UserBusinessUnitModel.objects
                .select_related("user", "business_unit", "role")
                .get(id=membership_id)
            )
        except UserBusinessUnitModel.DoesNotExist:
            raise ValueError(f"Membership {membership_id} not found.")

    @staticmethod
    def get_all() -> QuerySet:
        return UserBusinessUnitModel.objects.select_related("user", "business_unit", "role").all()

    @staticmethod
    def get_by_user(user_id: uuid.UUID) -> List[UserBusinessUnitModel]:
        return list(
            UserBusinessUnitModel.objects
            .select_related("user", "business_unit", "role")
            .filter(user_id=user_id)
        )

    @staticmethod
    def get_by_business_unit(business_unit_id: uuid.UUID) -> List[UserBusinessUnitModel]:
        return list(
            UserBusinessUnitModel.objects
            .select_related("user", "business_unit", "role")
            .filter(business_unit_id=business_unit_id)
        )

    @staticmethod
    def create(**kwargs) -> UserBusinessUnitModel:
        return UserBusinessUnitModel.objects.create(**kwargs)

    @staticmethod
    def update(membership: UserBusinessUnitModel, **kwargs) -> UserBusinessUnitModel:
        for k, v in kwargs.items():
            setattr(membership, k, v)
        membership.save()
        return membership

    @staticmethod
    def soft_delete(
        membership: UserBusinessUnitModel,
        deleted_by_id: uuid.UUID | None = None,
    ) -> None:
        """
        ISSUE-07 FIX: Use soft_delete() instead of hard delete().
        Hard deleting membership records violated the platform-wide soft-delete policy
        (BaseModel docstring: 'hard delete is PROHIBITED for business data').
        """
        membership.soft_delete(deleted_by_id=deleted_by_id)

    @staticmethod
    def hard_delete(membership: UserBusinessUnitModel) -> None:
        """
        Permanent removal — reserved for super-admin cleanup only.
        Callers must confirm intent explicitly by using this method name.
        """
        membership.delete()
