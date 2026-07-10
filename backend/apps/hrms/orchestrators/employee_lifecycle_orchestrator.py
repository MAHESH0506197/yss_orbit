# yss_orbit\backend\apps\hrms\orchestrators\employee_lifecycle_orchestrator.py
from django.db import transaction
from typing import Dict, Any, Optional
import uuid

from apps.hrms.models.employee import Employee
from apps.hrms.services.hrms_service import HRMSService
from apps.platform.services.outbox_service import OutboxService

class EmployeeLifecycleOrchestrator:
    """
    Coordinates multi-step onboarding process for an employee.
    Steps:
    1. Create employee record.
    2. Salary template (Mock/Stub).
    3. Leave balances (Mock/Stub).
    4. Provision user access (Mock/Stub).
    5. Publish employee.created domain event.
    """

    def __init__(self, hrms_service: HRMSService | None = None):
        self.hrms_service = hrms_service or HRMSService()

    @transaction.atomic
    def onboard_employee(self, bu_id: uuid.UUID, employee_data: Dict[str, Any], created_by_id: uuid.UUID) -> Employee:
        try:
            # Step 1: Create Employee (HRMS Bounded Context)
            employee = self.hrms_service.create_employee(bu_id, employee_data, created_by_id)

            # Step 2: Salary Template (Payroll Bounded Context - to be implemented)
            # payroll_service.assign_template(employee.id, employee_data.get('salary_template_id'))

            # Step 3: Leave Balances (Leave Bounded Context - to be implemented)
            # leave_service.initialize_balances(employee.id)

            # Step 4: Provision User (Users/Auth Bounded Context - to be implemented)
            # user = user_service.provision_for_employee(employee)
            # employee.user_id = user.id
            # employee.save(update_fields=['user_id'])

            # Step 5: Publish Domain Event
            payload = {
                "employee_id": str(employee.id),
                "business_unit_id": str(employee.business_unit_id),
                "employee_code": employee.employee_code,
                "first_name": employee.first_name,
                "last_name": employee.last_name,
                "email": employee.work_email or employee.personal_email,
                "department_id": str(employee.department_id) if employee.department_id else None,
                "designation_id": str(employee.designation_id) if employee.designation_id else None,
                "employment_type": employee.employment_type,
            }
            OutboxService.publish(
                message_type="employee.created",
                destination="employee_events",
                payload=payload
            )

            return employee

        except Exception as e:
            # The transaction.atomic block ensures that if any step fails, everything is rolled back.
            # E02 pattern: compensation is handled by database rollback here since we are in a single local transaction.
            raise e
