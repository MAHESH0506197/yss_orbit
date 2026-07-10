import uuid
import logging
from decimal import Decimal
from datetime import date, timedelta
from django.db import transaction
from django.db.models import Q
from django.core.exceptions import ValidationError

from apps.hrms.models import LeaveRequest, LeaveRequestHistory, LeaveType, LeaveBalance, LeaveRestrictionWindow, Employee, HolidayCalendar, Holiday, AttendanceRecord
from apps.hrms.services.lifecycle_event_publisher import LifecycleEventPublisher
from .leave_allocation_service import LeaveAllocationService

logger = logging.getLogger(__name__)


class LeaveService:
    """
    Implements core business logic for Leave Management.
    """

    @classmethod
    def validate_leave_overlap(cls, employee_id: uuid.UUID, start_date: date, end_date: date, exclude_request_id: uuid.UUID | None = None) -> None:
        """
        Validates that the requested dates do not overlap with existing approved/pending leaves.
        """
        qs = LeaveRequest.objects.filter(
            employee_id=employee_id,
            status__in=[
                LeaveRequest.StatusChoices.SUBMITTED,
                LeaveRequest.StatusChoices.MANAGER_APPROVED,
                LeaveRequest.StatusChoices.HR_APPROVED,
                LeaveRequest.StatusChoices.APPROVED
            ],
            start_date__lte=end_date,
            end_date__gte=start_date
        )
        if exclude_request_id:
            qs = qs.exclude(id=exclude_request_id)
            
        if qs.exists():
            raise ValidationError("Leave dates overlap with an existing request.")

    @classmethod
    def validate_restriction_windows(cls, bu_id: uuid.UUID, start_date: date, end_date: date) -> None:
        """
        Validates that leave does not fall into active blackout dates.
        """
        qs = LeaveRestrictionWindow.objects.filter(
            business_unit_id=bu_id,
            is_active=True,
            start_date__lte=end_date,
            end_date__gte=start_date
        )
        if qs.exists():
            window = qs.first()
            raise ValidationError(f"Leave is restricted during blackout period: {window.name} ({window.start_date} to {window.end_date})")

    @classmethod
    def calculate_leave_days(cls, bu_id: uuid.UUID, start_date: date, end_date: date, session: str, leave_type: LeaveType) -> Decimal:
        """
        Computes total leave days, optionally excluding weekends and holidays.
        """
        days = Decimal("0.00")
        current_date = start_date
        
        # Load holidays if needed
        holidays = set()
        if leave_type.exclude_holidays:
            holidays_qs = Holiday.objects.filter(
                calendar__business_unit_id=bu_id,
                date__gte=start_date,
                date__lte=end_date
            ).values_list('date', flat=True)
            holidays = set(holidays_qs)
        
        while current_date <= end_date:
            is_weekend = current_date.weekday() >= 5  # Sat/Sun
            is_holiday = current_date in holidays
            
            skip = False
            if leave_type.exclude_weekends and is_weekend:
                skip = True
            if leave_type.exclude_holidays and is_holiday:
                skip = True
                
            if not skip:
                if start_date == end_date and session in [LeaveRequest.SessionChoices.FIRST_HALF, LeaveRequest.SessionChoices.SECOND_HALF]:
                    days += Decimal("0.50")
                else:
                    days += Decimal("1.00")
            
            current_date += timedelta(days=1)
            
        return days

    @classmethod
    @transaction.atomic
    def apply_leave(cls, bu_id: uuid.UUID, employee_id: uuid.UUID, leave_type_id: uuid.UUID, 
                   start_date: date, end_date: date, session: str, reason: str, 
                   has_attachment: bool = False) -> LeaveRequest:
        
        leave_type = LeaveType.objects.get(business_unit_id=bu_id, id=leave_type_id)
        
        # 1. Validate dates
        if end_date < start_date:
            raise ValidationError("End date cannot be before start date.")
            
        cls.validate_leave_overlap(employee_id, start_date, end_date)
        cls.validate_restriction_windows(bu_id, start_date, end_date)
        
        # 2. Calculate days
        leave_days = cls.calculate_leave_days(bu_id, start_date, end_date, session, leave_type)
        if leave_days == 0:
            raise ValidationError("0 effective leave days after excluding weekends/holidays.")
            
        # 3. Attachment validation
        if leave_type.requires_attachment and leave_days > leave_type.attachment_after_days and not has_attachment:
            raise ValidationError(f"Attachment is required for {leave_type.name} exceeding {leave_type.attachment_after_days} days.")
            
        # 4. Balance check
        year = start_date.year
        try:
            balance = LeaveBalance.objects.get(
                business_unit_id=bu_id, employee_id=employee_id,
                leave_type=leave_type, year=year
            )
        except LeaveBalance.DoesNotExist:
            if leave_type.is_lop:
                # LOP requires no pre-existing balance — auto-create at zero
                balance = LeaveBalance.objects.create(
                    business_unit_id=bu_id,
                    employee_id=employee_id,
                    leave_type=leave_type,
                    year=year,
                    opening_balance=Decimal("0.00"),
                    consumed_days=Decimal("0.00"),
                    closing_balance=Decimal("0.00"),
                )
            else:
                raise ValidationError(
                    f"No leave balance record found for {leave_type.name} in {year}. "
                    f"Please contact HR to allocate your leave balance."
                )
        if not leave_type.allow_negative_balance and (balance.closing_balance < leave_days) and not leave_type.is_lop:
             raise ValidationError(f"Insufficient leave balance. Requires {leave_days}, but only {balance.closing_balance} available.")
             
        # 5. Create Request
        req = LeaveRequest.objects.create(
            business_unit_id=bu_id,
            employee_id=employee_id,
            leave_type=leave_type,
            start_date=start_date,
            end_date=end_date,
            session=session,
            reason=reason,
            status=LeaveRequest.StatusChoices.SUBMITTED if leave_type.requires_approval else LeaveRequest.StatusChoices.APPROVED
        )
        
        LeaveRequestHistory.objects.create(
            business_unit_id=bu_id,
            leave_request=req,
            status=req.status,
            changed_by_id=employee_id,
            remarks="Leave applied."
        )
        
        if req.status == LeaveRequest.StatusChoices.APPROVED:
            cls._post_approval_actions(bu_id, req, leave_days)
            
        return req

    @classmethod
    @transaction.atomic
    def approve_leave_manager(cls, bu_id: uuid.UUID, request_id: uuid.UUID, manager_id: uuid.UUID, comments: str) -> LeaveRequest:
        req = LeaveRequest.objects.select_for_update().get(business_unit_id=bu_id, id=request_id)
        
        if req.employee_id == manager_id:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("You cannot approve your own leave request.")
        
        if req.status != LeaveRequest.StatusChoices.SUBMITTED:
            raise ValidationError("Request is not in SUBMITTED state.")
            
        req.manager_approved_by_id = manager_id
        req.manager_comments = comments
        
        if req.leave_type.requires_hr_approval:
            req.status = LeaveRequest.StatusChoices.MANAGER_APPROVED
        else:
            req.status = LeaveRequest.StatusChoices.APPROVED
            
        req.save()
        
        LeaveRequestHistory.objects.create(
            business_unit_id=bu_id,
            leave_request=req,
            status=req.status,
            changed_by_id=manager_id,
            remarks=comments
        )
        
        if req.status == LeaveRequest.StatusChoices.APPROVED:
            leave_days = cls.calculate_leave_days(bu_id, req.start_date, req.end_date, req.session, req.leave_type)
            cls._post_approval_actions(bu_id, req, leave_days)
            
        return req
        
    @classmethod
    def _post_approval_actions(cls, bu_id: uuid.UUID, req: LeaveRequest, leave_days: Decimal):
        """
        Deducts balance and creates Attendance records.
        """
        year = req.start_date.year
        balance = LeaveBalance.objects.select_for_update().get(business_unit_id=bu_id, employee_id=req.employee_id, leave_type=req.leave_type, year=year)
        balance.consumed_days += leave_days
        balance.save()
        LeaveAllocationService.recalculate_closing_balance(balance)
        
        # Attendance Integration
        status_to_mark = AttendanceRecord.Status.PAID_LEAVE
        if req.leave_type.is_lop:
            status_to_mark = AttendanceRecord.Status.UNPAID_LEAVE
            
        current_date = req.start_date
        while current_date <= req.end_date:
            # Note: We should skip weekends/holidays if the leave type excluded them, 
            # but for simplicity, we mark them if the record is generated.
            record, _ = AttendanceRecord.objects.get_or_create(
                business_unit_id=bu_id,
                employee_id=req.employee_id,
                attendance_date=current_date,
                defaults={'status': status_to_mark}
            )
            record.status = status_to_mark
            record.save(update_fields=['status'])
            current_date += timedelta(days=1)

        # ── Phase 3: LifecycleEventPublisher + NotificationService wiring ──────
        # Both calls are outside the attendance loop but inside _post_approval_actions.
        # Errors are caught and logged — they must not abort the leave approval.

        # 1. Publish LEAVE_APPROVED to the Employee 360 Timeline
        try:
            LifecycleEventPublisher.publish(
                employee_id=req.employee_id,
                business_unit_id=bu_id,
                event_type="LEAVE_APPROVED",
                title=f"{req.leave_type.name} approved: {req.start_date} to {req.end_date}",
                description=f"{leave_days} day(s) approved.",
                metadata={
                    "leave_type": req.leave_type.name,
                    "start_date": str(req.start_date),
                    "end_date": str(req.end_date),
                    "total_days": str(leave_days),
                    "session": req.session,
                },
                reference_id=req.id,
            )
        except Exception as exc:
            logger.warning(
                "LifecycleEventPublisher failed for leave approval req=%s: %s",
                req.id, exc, exc_info=True,
            )

        # 2. Dispatch LEAVE_APPROVED in-app + email notification to employee
        try:
            emp = Employee.objects.filter(
                business_unit_id=bu_id, id=req.employee_id
            ).only("user_id", "first_name", "last_name").first()

            if emp is not None and emp.user_id is not None:
                from apps.platform.services import NotificationService
                NotificationService.notify_leave_approved(
                    business_unit_id=bu_id,
                    recipient_user_id=emp.user_id,
                    employee_name=f"{emp.first_name} {emp.last_name}",
                    leave_type=req.leave_type.name,
                    from_date=str(req.start_date),
                    to_date=str(req.end_date),
                    correlation_id=str(req.id),
                )
        except Exception as exc:
            logger.warning(
                "NotificationService failed for leave approval req=%s: %s",
                req.id, exc, exc_info=True,
            )

    @classmethod
    def get_payroll_summary(cls, bu_id: uuid.UUID, employee_id: uuid.UUID, start_date: date, end_date: date) -> dict:
        """
        Returns Paid Leave Days, Unpaid Leave Days, LOP Days for payroll engine.
        """
        records = AttendanceRecord.objects.filter(
            business_unit_id=bu_id,
            employee_id=employee_id,
            attendance_date__gte=start_date,
            attendance_date__lte=end_date
        )
        
        paid = records.filter(status=AttendanceRecord.Status.PAID_LEAVE).count()
        unpaid = records.filter(status=AttendanceRecord.Status.UNPAID_LEAVE).count()
        
        return {
            "paid_leave_days": paid,
            "unpaid_leave_days": unpaid,
            "lop_days": unpaid  # LOP maps to unpaid directly here
        }

    # ── Phase-Completion: HR Approve, Cancel, Reject ─────────────────────────

    @classmethod
    @transaction.atomic
    def approve_leave_hr(
        cls,
        bu_id: uuid.UUID,
        request_id: uuid.UUID,
        hr_id: uuid.UUID,
        comments: str = "",
    ) -> LeaveRequest:
        """
        Second-step HR approval: MANAGER_APPROVED → APPROVED.
        Also handles direct HR approval when leave type skips manager step.
        """
        req = LeaveRequest.objects.select_for_update().get(
            business_unit_id=bu_id, id=request_id
        )

        if req.employee_id == hr_id:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("You cannot approve your own leave request.")

        allowed_statuses = [
            LeaveRequest.StatusChoices.SUBMITTED,          # HR can approve directly
            LeaveRequest.StatusChoices.MANAGER_APPROVED,   # Normal 2-step flow
        ]
        if req.status not in allowed_statuses:
            raise ValidationError(
                f"Leave request is in '{req.status}' status — HR approval not applicable."
            )

        req.hr_approved_by_id = hr_id
        req.hr_comments = comments
        req.status = LeaveRequest.StatusChoices.APPROVED
        req.save()

        LeaveRequestHistory.objects.create(
            business_unit_id=bu_id,
            leave_request=req,
            status=req.status,
            changed_by_id=hr_id,
            remarks=f"HR approved. {comments}".strip(),
        )

        # Post-approval: deduct balance + mark attendance
        leave_days = cls.calculate_leave_days(
            bu_id, req.start_date, req.end_date, req.session, req.leave_type
        )
        cls._post_approval_actions(bu_id, req, leave_days)
        return req

    @classmethod
    @transaction.atomic
    def cancel_leave(
        cls,
        bu_id: uuid.UUID,
        request_id: uuid.UUID,
        cancelled_by_id: uuid.UUID,
        reason: str = "",
    ) -> LeaveRequest:
        """
        Employee self-cancellation or HR cancellation.
        Allowed states: SUBMITTED, MANAGER_APPROVED.
        For APPROVED leaves, balance is restored and attendance records are reverted.
        """
        req = LeaveRequest.objects.select_for_update().get(
            business_unit_id=bu_id, id=request_id
        )

        cancellable = [
            LeaveRequest.StatusChoices.SUBMITTED,
            LeaveRequest.StatusChoices.MANAGER_APPROVED,
            LeaveRequest.StatusChoices.APPROVED,
        ]
        if req.status not in cancellable:
            raise ValidationError(
                f"Cannot cancel a leave request in '{req.status}' status."
            )

        was_approved = req.status == LeaveRequest.StatusChoices.APPROVED

        req.status = LeaveRequest.StatusChoices.CANCELLED
        req.save()

        LeaveRequestHistory.objects.create(
            business_unit_id=bu_id,
            leave_request=req,
            status=req.status,
            changed_by_id=cancelled_by_id,
            remarks=f"Cancelled. {reason}".strip(),
        )

        # Restore balance if the leave was already approved
        if was_approved:
            leave_days = cls.calculate_leave_days(
                bu_id, req.start_date, req.end_date, req.session, req.leave_type
            )
            year = req.start_date.year
            try:
                balance = LeaveBalance.objects.select_for_update().get(
                    business_unit_id=bu_id,
                    employee_id=req.employee_id,
                    leave_type=req.leave_type,
                    year=year,
                )
                balance.consumed_days = max(
                    Decimal("0.00"), balance.consumed_days - leave_days
                )
                balance.save()
                LeaveAllocationService.recalculate_closing_balance(balance)
            except LeaveBalance.DoesNotExist:
                logger.warning(
                    "cancel_leave: no balance record to restore for emp=%s leave_type=%s year=%s",
                    req.employee_id, req.leave_type_id, year,
                )

            # Revert attendance records to ABSENT
            from datetime import timedelta
            current_date = req.start_date
            while current_date <= req.end_date:
                AttendanceRecord.objects.filter(
                    business_unit_id=bu_id,
                    employee_id=req.employee_id,
                    attendance_date=current_date,
                    status__in=[
                        AttendanceRecord.Status.PAID_LEAVE,
                        AttendanceRecord.Status.UNPAID_LEAVE,
                    ],
                ).update(status=AttendanceRecord.Status.ABSENT)
                current_date += timedelta(days=1)

        return req

    @classmethod
    @transaction.atomic
    def reject_leave(
        cls,
        bu_id: uuid.UUID,
        request_id: uuid.UUID,
        rejector_id: uuid.UUID,
        comments: str = "",
    ) -> LeaveRequest:
        """
        Manager or HR rejects a pending leave request.
        Allowed states: SUBMITTED, MANAGER_APPROVED.
        """
        req = LeaveRequest.objects.select_for_update().get(
            business_unit_id=bu_id, id=request_id
        )

        rejectable = [
            LeaveRequest.StatusChoices.SUBMITTED,
            LeaveRequest.StatusChoices.MANAGER_APPROVED,
        ]
        if req.status not in rejectable:
            raise ValidationError(
                f"Cannot reject a leave request in '{req.status}' status."
            )

        req.status = LeaveRequest.StatusChoices.REJECTED
        req.save()

        LeaveRequestHistory.objects.create(
            business_unit_id=bu_id,
            leave_request=req,
            status=req.status,
            changed_by_id=rejector_id,
            remarks=f"Rejected. {comments}".strip(),
        )
        return req

