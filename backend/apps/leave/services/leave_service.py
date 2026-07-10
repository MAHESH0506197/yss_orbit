# yss_orbit/backend/apps/leave/services/leave_service.py
from datetime import date
from django.db import transaction
from django.utils import timezone
from apps.hrms.models import LeaveApplication, LeaveBalance
from apps.iam.security_context import SecurityContext
from apps.platform.publisher import EventPublisher
import uuid

class LeaveService:
    @staticmethod
    @transaction.atomic
    def apply_for_leave(
        security_context: SecurityContext,
        employee_id: uuid.UUID,
        leave_type_id: uuid.UUID,
        start_date: date,
        end_date: date,
        reason: str
    ) -> LeaveApplication:
        bu_id = security_context.require_business_unit()
        
        # Create Leave Application (pending)
        application = LeaveApplication.objects.create(
            business_unit_id=bu_id,
            employee_id=employee_id,
            leave_type_id=leave_type_id,
            start_date=start_date,
            end_date=end_date,
            reason=reason,
            status=LeaveApplication.Status.PENDING
        )
        return application

    @staticmethod
    @transaction.atomic
    def approve_leave(
        security_context: SecurityContext,
        application_id: uuid.UUID
    ) -> LeaveApplication:
        bu_id = security_context.require_business_unit()
        approver_id = security_context.effective_user_id

        application = LeaveApplication.objects.select_for_update().get(
            id=application_id, 
            business_unit_id=bu_id
        )

        if application.employee_id == approver_id:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("You cannot approve your own leave application.")

        if application.status == LeaveApplication.Status.APPROVED:
            return application

        application.status = LeaveApplication.Status.APPROVED
        application.approver_id = approver_id
        application.save()

        # Deduct Balance
        days = (application.end_date - application.start_date).days + 1
        balance = LeaveBalance.objects.select_for_update().get(
            business_unit_id=bu_id,
            employee_id=application.employee_id,
            leave_type=application.leave_type
        )
        balance.balance -= days
        balance.save()

        # Emit Domain Event via Outbox
        EventPublisher.publish(
            event_type="leave.approved",
            aggregate_type="leave.LeaveApplication",
            aggregate_id=application.id,
            business_unit_id=bu_id,
            payload={
                "employee_id": str(application.employee_id),
                "start_date": application.start_date.isoformat(),
                "end_date": application.end_date.isoformat(),
            },
            correlation_id=security_context.correlation_id,
        )

        return application
