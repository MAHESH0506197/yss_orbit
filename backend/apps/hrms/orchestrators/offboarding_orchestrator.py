# yss_orbit\backend\apps\hrms\orchestrators\offboarding_orchestrator.py
from django.db import transaction
from typing import Dict, Any, Optional
import uuid
import datetime

from apps.hrms.models.employee import Employee
from apps.hrms.services.hrms_service import HRMSService
from apps.platform.services.outbox_service import OutboxService

class OffboardingOrchestrator:
    """
    Coordinates multi-step offboarding process for an employee.
    Steps:
    1. Mark employee as RESIGNED/TERMINATED in HRMS.
    2. Final payroll trigger (Mock/Stub).
    3. Revoke system access (Mock/Stub).
    4. Archive documents (Mock/Stub).
    5. Publish employee.terminated domain event.
    """

    def __init__(self, hrms_service: HRMSService | None = None):
        self.hrms_service = hrms_service or HRMSService()

    @transaction.atomic
    def offboard_employee(self, bu_id: uuid.UUID, employee_id: uuid.UUID, updated_by_id: uuid.UUID, reason: str = "RESIGNED", date_of_leaving: datetime.date | None = None) -> Employee:
        try:
            # Step 1: Update Employee Status
            employee = self.hrms_service.get_employee(bu_id, employee_id)
            
            # Map reason to EmploymentStatus
            status_map = {
                "RESIGNED": Employee.EmploymentStatus.RESIGNED,
                "TERMINATED": Employee.EmploymentStatus.TERMINATED,
                "RETIRED": Employee.EmploymentStatus.RETIRED
            }
            new_status = status_map.get(reason.upper(), Employee.EmploymentStatus.RESIGNED)
            
            data_to_update = {
                "employment_status": new_status
            }
            if date_of_leaving:
                data_to_update["date_of_leaving"] = date_of_leaving
                
            employee = self.hrms_service.update_employee(bu_id, employee_id, data_to_update, updated_by_id)

            # Step 2: Revoke Access (Users/Auth Bounded Context - to be implemented)
            # if employee.user_id:
            #     user_service.deactivate_user(employee.user_id)

            # Step 3: Final Payroll (Payroll Bounded Context - to be implemented)
            # payroll_service.trigger_final_settlement(employee.id)

            # Step 4: Archive Docs (Files/Documents Bounded Context - to be implemented)
            # document_service.archive_employee_documents(employee.id)

            # Step 5: Publish Domain Event
            payload = {
                "employee_id": str(employee.id),
                "business_unit_id": str(employee.business_unit_id),
                "employee_code": employee.employee_code,
                "status": employee.employment_status,
                "date_of_leaving": str(employee.date_of_leaving) if employee.date_of_leaving else None,
                "reason": reason
            }
            OutboxService.publish(
                message_type="employee.terminated",
                destination="employee_events",
                payload=payload
            )

            return employee

        except Exception as e:
            # Compensation via database rollback for local steps.
            raise e
