# DEPRECATED - DO NOT USE. Scheduled for removal. Use apps.hrms instead.
# yss_orbit/backend/apps/hrms_core/services/employee_service.py
import logging
import uuid
from typing import Dict, Any

from django.db import transaction

from apps.platform.core_exceptions import ResourceNotFoundException
from apps.iam.security_context import SecurityContext
from apps.hrms_core.models import Employee
from apps.hrms_core.repositories.employee_repository import EmployeeRepository
from core.audit.audit_service import AuditService
from apps.platform.publisher import EventPublisher

logger = logging.getLogger(__name__)

class EmployeeService:
    """
    Service class handling business logic for Employee onboarding and management.
    """
    def __init__(self):
        self.repository = EmployeeRepository()

    @transaction.atomic
    def onboard_employee(self, security_context: SecurityContext, data: Dict[str, Any]) -> Employee:
        bu_id = security_context.require_business_unit()
        
        data["created_by_id"] = security_context.effective_user_id
        data["updated_by_id"] = security_context.effective_user_id
        data["status"] = "ACTIVE"

        employee = self.repository.create(business_unit_id=bu_id, data=data)
        
        AuditService.record(
            action="CREATE",
            resource="hrms_core.Employee",
            resource_id=str(employee.id),
            changes=data,
            status="SUCCESS"
        )
        
        # Publish event for downstream modules (Payroll, Attendance, etc.)
        EventPublisher.publish(
            event_type="employee.created",
            aggregate_type="hrms_core.Employee",
            aggregate_id=employee.id,
            business_unit_id=bu_id,
            payload={"employee_id": employee.employee_id, "user_id": str(employee.user_id)},
            correlation_id=security_context.correlation_id,
        )
        
        return employee

    @transaction.atomic
    def update_employee(self, security_context: SecurityContext, employee_id: uuid.UUID, data: Dict[str, Any]) -> Employee:
        bu_id = security_context.require_business_unit()
        employee = self.repository.get_by_id(employee_id, bu_id)
        if not employee:
            raise ResourceNotFoundException("Employee not found")

        data["updated_by_id"] = security_context.effective_user_id
        employee = self.repository.update(employee, data)
        
        AuditService.record(
            action="UPDATE",
            resource="hrms_core.Employee",
            resource_id=str(employee.id),
            changes=data,
            status="SUCCESS"
        )
        return employee

    @transaction.atomic
    def terminate_employee(self, security_context: SecurityContext, employee_id: uuid.UUID) -> Employee:
        bu_id = security_context.require_business_unit()
        employee = self.repository.get_by_id(employee_id, bu_id)
        if not employee:
            raise ResourceNotFoundException("Employee not found")

        employee = self.repository.update(employee, {
            "status": "TERMINATED",
            "updated_by_id": security_context.effective_user_id
        })
        
        AuditService.record(
            action="UPDATE",
            resource="hrms_core.Employee",
            resource_id=str(employee.id),
            changes={"status": "TERMINATED"},
            status="SUCCESS"
        )
        
        EventPublisher.publish(
            event_type="employee.terminated",
            aggregate_type="hrms_core.Employee",
            aggregate_id=employee.id,
            business_unit_id=bu_id,
            payload={"employee_id": employee.employee_id, "user_id": str(employee.user_id)},
            correlation_id=security_context.correlation_id,
        )
        
        return employee
