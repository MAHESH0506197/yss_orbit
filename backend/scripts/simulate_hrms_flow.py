import os
import sys
import django
from datetime import date, timedelta
import uuid

# Add backend to path and setup Django
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings.development")
django.setup()

from django.contrib.auth import get_user_model
from apps.organization.models import BusinessUnit
from apps.hrms.models import LeaveType, LeaveBalance, LeaveApplication
from apps.leave.services.leave_service import LeaveService
from apps.attendance.services.attendance_service import AttendanceService
from apps.hrms.models import AttendanceRecord
from apps.payroll.services.payroll_service import PayrollService
from apps.payroll.models.payslip import Payslip
from apps.platform.models.outbox_model import OutboxMessage, OutboxStatus

User = get_user_model()

def run_simulation():
    print("Starting HRMS E2E Simulation...")

    bu = BusinessUnit.objects.filter(code="HQ01").first()
    if not bu:
        print("BU HQ01 not found. Please run seed_enterprise_data.py first.")
        return

    employee = User.objects.filter(username="mgr_hq").first()
    if not employee:
        print("Employee mgr_hq not found.")
        return

    tenant_id = bu.id
    emp_id = employee.id

    # 1. Setup Leave Type & Balance
    l_type, _ = LeaveType.objects.get_or_create(
        business_unit_id=tenant_id,
        name="Annual Leave",
        defaults={"days_allowed": 20, "is_carry_forward": True}
    )
    bal, _ = LeaveBalance.objects.get_or_create(
        business_unit_id=tenant_id,
        employee_id=emp_id,
        leave_type=l_type,
        defaults={"balance": 15.0}
    )
    print(f"Leave Balance setup: {bal.balance} days of {l_type.name}")

    # 2. Record Attendance for the first 20 days of the month (Assume current month)
    today = date.today()
    start_of_month = date(today.year, today.month, 1)

    print("Recording attendance (PRESENT) for first 20 days...")
    for i in range(20):
        punch_date = start_of_month + timedelta(days=i)
        AttendanceRecord.objects.update_or_create(
            business_unit_id=tenant_id,
            employee_id=emp_id,
            date=punch_date,
            defaults={
                "status": AttendanceRecord.AttendanceStatus.PRESENT,
                "source": AttendanceRecord.Source.SYSTEM
            }
        )

    # 3. Apply and Approve Leave (Days 21 and 22)
    leave_start = start_of_month + timedelta(days=20)
    leave_end = start_of_month + timedelta(days=21)
    
    print(f"Applying for leave: {leave_start} to {leave_end}")
    application = LeaveService.apply_for_leave(
        tenant_id=tenant_id,
        employee_id=emp_id,
        leave_type_id=l_type.id,
        start_date=leave_start,
        end_date=leave_end,
        reason="Vacation"
    )

    print("Approving leave...")
    LeaveService.approve_leave(
        tenant_id=tenant_id,
        application_id=application.id,
        approver_id=emp_id  # self-approve for simulation
    )

    # Check updated balance
    bal.refresh_from_db()
    print(f"New Leave Balance: {bal.balance} days")

    # 4. Simulate Outbox Event Processing
    outbox_msgs = OutboxMessage.objects.filter(status=OutboxStatus.PENDING, message_type="leave.approved")
    for msg in outbox_msgs:
        print(f"Processing Outbox Event: {msg.message_type}")
        AttendanceService.process_leave_approved_event(msg.payload)
        msg.status = OutboxStatus.PUBLISHED
        msg.save()

    # Verify Attendance Records updated to LEAVE
    leaves = AttendanceRecord.objects.filter(
        business_unit_id=tenant_id,
        employee_id=emp_id,
        status=AttendanceRecord.AttendanceStatus.LEAVE
    )
    print(f"Attendance Records marked as LEAVE: {leaves.count()} days")

    # 5. Process Payroll
    from apps.payroll.models.payroll_run_model import PayrollRun
    PayrollRun.objects.filter(month=today.month, year=today.year, business_unit_id=tenant_id).delete()
    print("Generating Monthly Payroll...")
    run = PayrollService.generate_monthly_payroll(
        tenant_id=tenant_id,
        month=today.month,
        year=today.year
    )

    payslip = Payslip.objects.filter(month=today.month, year=today.year, business_unit_id=tenant_id, employee_id=emp_id).first()
    print(f"Payroll Generated Successfully! Run ID: {run.id}")
    print(f"   => Employee: {employee.username}")
    print(f"   => Gross Pay: {payslip.gross_salary}")
    print(f"   => Net Pay: {payslip.net_salary}")

if __name__ == "__main__":
    run_simulation()
