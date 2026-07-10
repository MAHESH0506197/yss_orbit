# DEPRECATED - DO NOT USE. Scheduled for removal. Use apps.hrms instead.
# yss_orbit/backend/apps/hrms_core/repositories/employee_repository.py
import uuid
from typing import Optional, Dict, Any
from django.db.models import QuerySet

from apps.hrms_core.models import Employee

class EmployeeRepository:
    """
    Repository for Employee model handling CRUD operations.
    Enforces business_unit_id scoping.
    """

    def get_by_id(self, employee_id: uuid.UUID, business_unit_id: uuid.UUID) -> Optional[Employee]:
        return Employee.objects.filter(id=employee_id, business_unit_id=business_unit_id).select_related('department', 'designation').first()

    def get_all(self, business_unit_id: uuid.UUID) -> QuerySet[Employee]:
        return Employee.objects.filter(business_unit_id=business_unit_id).select_related('department', 'designation')

    def create(self, business_unit_id: uuid.UUID, data: Dict[str, Any]) -> Employee:
        return Employee.objects.create(business_unit_id=business_unit_id, **data)

    def update(self, employee: Employee, data: Dict[str, Any]) -> Employee:
        for key, value in data.items():
            setattr(employee, key, value)
        employee.save()
        return employee

    def soft_delete(self, employee: Employee, deleted_by_id: uuid.UUID) -> None:
        employee.deleted_by_id = deleted_by_id
        employee.delete()
