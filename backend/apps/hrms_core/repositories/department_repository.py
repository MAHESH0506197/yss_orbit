# DEPRECATED - DO NOT USE. Scheduled for removal. Use apps.hrms instead.
# yss_orbit/backend/apps/hrms_core/repositories/department_repository.py
import uuid
from typing import Optional, Dict, Any
from django.db.models import QuerySet

from apps.hrms_core.models import Department

class DepartmentRepository:
    """
    Repository for Department model handling CRUD operations.
    Enforces business_unit_id scoping for all reads and writes.
    """

    def get_by_id(self, department_id: uuid.UUID, business_unit_id: uuid.UUID) -> Optional[Department]:
        return Department.objects.filter(id=department_id, business_unit_id=business_unit_id).first()

    def get_all(self, business_unit_id: uuid.UUID) -> QuerySet[Department]:
        return Department.objects.filter(business_unit_id=business_unit_id)

    def create(self, business_unit_id: uuid.UUID, data: Dict[str, Any]) -> Department:
        return Department.objects.create(business_unit_id=business_unit_id, **data)

    def update(self, department: Department, data: Dict[str, Any]) -> Department:
        for key, value in data.items():
            setattr(department, key, value)
        department.save()
        return department

    def soft_delete(self, department: Department, deleted_by_id: uuid.UUID) -> None:
        department.deleted_by_id = deleted_by_id
        department.delete()  # TenantModel handles soft deletion automatically
