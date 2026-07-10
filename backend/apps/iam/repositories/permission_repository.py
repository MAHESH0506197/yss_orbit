# yss_orbit/backend/apps/rbac/repositories/permission_repository.py
import uuid
from typing import Optional

from django.db.models import QuerySet
from apps.iam.models import Permission

class PermissionRepository:
    """
    Repository for Permission model.
    Handles data access for permissions.
    """

    def get_by_id(self, permission_id: uuid.UUID) -> Optional[Permission]:
        return Permission.objects.filter(id=permission_id).first()

    def get_by_code(self, code: str) -> Optional[Permission]:
        return Permission.objects.filter(code=code).first()

    def list_active(self) -> QuerySet[Permission]:
        return Permission.objects.filter(is_active=True)

    def create(self, **kwargs) -> Permission:
        return Permission.objects.create(**kwargs)

    def update(self, permission: Permission, **kwargs) -> Permission:
        for key, value in kwargs.items():
            setattr(permission, key, value)
        permission.save()
        return permission
