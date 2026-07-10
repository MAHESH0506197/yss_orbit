# yss_orbit\backend\apps\users\repositories\user_repository.py
from typing import Any
import uuid

from django.db.models import QuerySet

from apps.platform.repositories.base import PlatformRepository
from apps.iam.models.user import User
from apps.iam.models.membership import UserBusinessUnit
from apps.platform.core_exceptions import ResourceNotFoundException


class UserRepository(PlatformRepository[User]):
    def __init__(self) -> None:
        super().__init__(User)

    def get_by_username(self, username: str) -> User | None:
        try:
            return self.get_by_field(username=username)
        except ResourceNotFoundException:
            return None

    def get_by_email(self, email: str) -> User | None:
        try:
            return self.get_by_field(email=email)
        except ResourceNotFoundException:
            return None

    def list_by_business_unit(self, business_unit_id: uuid.UUID) -> QuerySet[User]:
        return self.model_class.objects.filter(
            business_unit_memberships__business_unit_id=business_unit_id,
            is_deleted=False
        )


class UserBusinessUnitRepository:
    def get_membership(self, user_id: uuid.UUID, business_unit_id: uuid.UUID) -> UserBusinessUnit | None:
        return UserBusinessUnit.objects.filter(
            user_id=user_id,
            business_unit_id=business_unit_id,
            is_active=True
        ).first()

    def add_user_to_business_unit(
        self,
        user_id: uuid.UUID,
        business_unit_id: uuid.UUID,
        role_id: uuid.UUID | None = None,
        invited_by_id: uuid.UUID | None = None,
    ) -> UserBusinessUnit:
        membership, created = UserBusinessUnit.objects.update_or_create(
            user_id=user_id,
            business_unit_id=business_unit_id,
            defaults={
                "role_id": role_id,
                "is_active": True,
                "invited_by_id": invited_by_id,
            }
        )
        return membership

    def remove_user_from_business_unit(self, user_id: uuid.UUID, business_unit_id: uuid.UUID) -> None:
        UserBusinessUnit.objects.filter(
            user_id=user_id,
            business_unit_id=business_unit_id
        ).update(is_active=False)
