from datetime import date
import calendar
from decimal import Decimal
from django.db import transaction
from django.utils import timezone
from apps.payroll.models.payroll_run_model import PayrollRun
from apps.payroll.models.payslip import Payslip
from apps.hrms.models import AttendanceRecord, Employee
from apps.hrms.services.attendance_service import AttendanceService
from apps.hrms.services.lifecycle_event_publisher import LifecycleEventPublisher
from apps.payroll.services.salary_computation_service import SalaryComputationService
import uuid
import logging

logger = logging.getLogger(__name__)

class PayrollService:
    @staticmethod
    @transaction.atomic
    def generate_monthly_payroll(tenant_id: uuid.UUID, month: int, year: int, run_by_id: uuid.UUID = None) -> PayrollRun:
        run, created = PayrollRun.objects.get_or_create(
            business_unit_id=tenant_id,
            month=month,
            year=year,
            defaults={"status": PayrollRun.Status.DRAFT, "run_by_id": run_by_id}
        )

        # P0-02/P0-03: Guard against destructive re-runs on immutable payroll states.
        if run.status in PayrollRun.IMMUTABLE_STATUSES:
            raise ValueError(
                f"Payroll run for {month}/{year} is {run.status} and cannot be re-generated. "
                f"Contact Finance to unlock."
            )
        if run.status == PayrollRun.Status.APPROVED:
            raise ValueError(
                f"Payroll run for {month}/{year} is APPROVED. Rollback to PROCESSED before re-running."
            )
        if run.status == PayrollRun.Status.PROCESSING:
            raise ValueError(
                f"Payroll run for {month}/{year} is already in PROCESSING state. "
                f"Wait for the current run to complete or mark as FAILED."
            )

        # Set status to processing
        run.status = PayrollRun.Status.PROCESSING
        run.save()

        # Delete old payslips for this run if any
        Payslip.objects.filter(payroll_run=run).delete()

        # Fetch the BU to get a fallback state_code
        from apps.organization.models import BusinessUnit
        bu_state_code = "NA"
        try:
            bu = BusinessUnit.objects.get(id=tenant_id)
            bu_state_code = bu.state or "NA"
        except BusinessUnit.DoesNotExist:
            pass

        # Get all active employees in BU
        employees = Employee.objects.filter(
            business_unit_id=tenant_id, 
            employment_status=Employee.EmploymentStatus.ACTIVE
        )
        
        _, num_days = calendar.monthrange(year, month)
        start_date = date(year, month, 1)
        end_date = date(year, month, num_days)

        payslips = []
        total_gross = Decimal("0")
        total_deductions = Decimal("0")
        total_net = Decimal("0")

        for emp in employees:
            # Query attendance records for this month
            records = AttendanceRecord.objects.filter(
                business_unit_id=tenant_id,
                employee=emp,
                attendance_date__range=[start_date, end_date]
            )

            # Calculate LOPs
            lop_from_attendance = records.filter(status=AttendanceRecord.Status.UNPAID_LEAVE).count()

            # Pack data
            employee_data = {
                "employee_code": emp.employee_code,
                "employee_name": f"{emp.first_name} {emp.last_name}",
                "basic_salary": emp.basic_salary,
                "ctc": emp.ctc,
                "salary_structure_id": emp.salary_structure_id,
                "payment_mode": Payslip.PaymentMode.BANK_TRANSFER,
                # --- Phase 1 fix: required by SalaryComputationService ---
                "worker_type": emp.worker_type,   # gates PF/ESI/PT/LWF for contractors
                "state_code": emp.state_code or bu_state_code,  # drives ProfessionalTaxSlab lookup
            }
            attendance_data = {
                "working_days": num_days,
                "lop_days": lop_from_attendance
            }
            leave_data = {
                "lop_days": 0 # Handled by attendance sync
            }

            # Call SalaryComputationService
            payslip = SalaryComputationService.compute_payslip(
                employee_id=emp.id,
                payroll_run=run,
                employee_data=employee_data,
                attendance_data=attendance_data,
                leave_data=leave_data,
                correlation_id=str(uuid.uuid4())
            )
            
            payslips.append(payslip)
            total_gross += payslip.gross_salary
            total_deductions += payslip.total_deductions
            total_net += payslip.net_salary

        # Update run stats
        run.total_gross = total_gross
        run.total_deductions = total_deductions
        run.total_net = total_net
        run.total_employees = len(payslips)
        run.status = PayrollRun.Status.PROCESSED
        run.save()

        # Lock attendance for this period
        AttendanceService.lock_attendance(
            business_unit_id=tenant_id,
            start_date=start_date,
            end_date=end_date,
            locked_by_id=run_by_id if run_by_id else uuid.UUID(int=0)
        )

        # ── Cross-module sync: Publish PAYROLL_PROCESSED event for each employee ──
        # This populates the Employee 360 Timeline so HR/Finance can see payroll
        # history alongside transfers, promotions, and leave events.
        # Errors are silenced per-employee — they must NOT roll back payroll.
        for payslip in payslips:
            try:
                LifecycleEventPublisher.publish(
                    employee_id=payslip.employee_id,
                    business_unit_id=tenant_id,
                    event_type="PAYROLL_PROCESSED",
                    title=f"Payroll processed for {month:02d}/{year}",
                    description=(
                        f"Gross: ₹{payslip.gross_salary:,.2f} | "
                        f"Deductions: ₹{payslip.total_deductions:,.2f} | "
                        f"Net: ₹{payslip.net_salary:,.2f}"
                    ),
                    metadata={
                        "month": month,
                        "year": year,
                        "payroll_run_id": str(run.id),
                        "payslip_id": str(payslip.id),
                        "gross_salary": str(payslip.gross_salary),
                        "net_salary": str(payslip.net_salary),
                    },
                    actor_id=run_by_id,
                    reference_id=payslip.id,
                    event_date=end_date,
                )
            except Exception as exc:
                logger.warning(
                    "LifecycleEventPublisher failed for PAYROLL_PROCESSED "
                    "emp=%s payslip=%s: %s",
                    payslip.employee_id, payslip.id, exc, exc_info=True,
                )

        return run