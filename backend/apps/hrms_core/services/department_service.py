# DEPRECATED - DO NOT USE. Scheduled for removal. Use apps.hrms instead.
# yss_orbit/backend/apps/hrms_core/services/department_service.py
import logging
import uuid
from typing import Dict, Any

from django.db import transaction

from apps.platform.core_exceptions import ResourceNotFoundException
from apps.iam.security_context import SecurityContext
from apps.hrms_core.models import Department
from apps.hrms_core.repositories.department_repository import DepartmentRepository
from core.audit.audit_service import AuditService

logger = logging.getLogger(__name__)

class DepartmentService:
    """
    Service class handling business logic for Department.
    """
    def __init__(self):
        self.repository = DepartmentRepository()

    @transaction.atomic
    def create_department(self, security_context: SecurityContext, data: Dict[str, Any]) -> Department:
        bu_id = security_context.require_business_unit()
        
        data["created_by_id"] = security_context.effective_user_id
        data["updated_by_id"] = security_context.effective_user_id

        department = self.repository.create(business_unit_id=bu_id, data=data)
        
        AuditService.record(
            action="CREATE",
            resource="hrms_core.Department",
            resource_id=str(department.id),
            changes=data,
            status="SUCCESS"
        )
        logger.info(f"Department {department.name} created successfully.")
        return department

    @transaction.atomic
    def update_department(self, security_context: SecurityContext, department_id: uuid.UUID, data: Dict[str, Any]) -> Department:
        bu_id = security_context.require_business_unit()
        department = self.repository.get_by_id(department_id, bu_id)
        if not department:
            raise ResourceNotFoundException("Department not found")

        data["updated_by_id"] = security_context.effective_user_id
        department = self.repository.update(department, data)
        
        AuditService.record(
            action="UPDATE",
            resource="hrms_core.Department",
            resource_id=str(department.id),
            changes=data,
            status="SUCCESS"
        )
        return department

    @transaction.atomic
    def delete_department(self, security_context: SecurityContext, department_id: uuid.UUID) -> None:
        bu_id = security_context.require_business_unit()
        department = self.repository.get_by_id(department_id, bu_id)
        if not department:
            raise ResourceNotFoundException("Department not found")

        self.repository.soft_delete(department, deleted_by_id=security_context.effective_user_id)
        
        AuditService.record(
            action="DELETE",
            resource="hrms_core.Department",
            resource_id=str(department_id),
            changes={},
            status="SUCCESS"
        )
