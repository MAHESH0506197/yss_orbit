# yss_orbit/backend/apps/rbac/repositories/role_repository.py
import uuid
from typing import Optional

from django.db.models import QuerySet
from apps.iam.models.rbac_models import Role

class RoleRepository:
    """
    Repository for Role model.
    Handles data access for roles scoped to a business unit.
    """

    def get_by_id(self, role_id: uuid.UUID) -> Optional[Role]:
        return Role.objects.filter(id=role_id, is_deleted=False).first()

    def get_by_name_in_bu(self, business_unit_id: uuid.UUID, name: str) -> Optional[Role]:
        return Role.objects.filter(business_unit_id=business_unit_id, name=name, is_deleted=False).first()

    def list_for_bu(self, business_unit_id: uuid.UUID) -> QuerySet[Role]:
        return Role.objects.filter(business_unit_id=business_unit_id, is_deleted=False)

    def create(self, **kwargs) -> Role:
        return Role.objects.create(**kwargs)

    def update(self, role: Role, **kwargs) -> Role:
        for key, value in kwargs.items():
            setattr(role, key, value)
        role.save()
        return role

    def delete(self, role: Role) -> None:
        role.is_deleted = True
        role.save(update_fields=["is_deleted"])
