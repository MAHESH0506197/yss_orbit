import uuid
from decimal import Decimal
from datetime import date
from django.test import TestCase
from django.core.exceptions import ValidationError

from apps.organization.models.organization_model import Organization
from apps.organization.models import BusinessUnit
from apps.hrms.models import (
    Employee, LeavePolicy, LeaveType, LeaveBalance, 
    LeaveRequest, LeaveRestrictionWindow, AttendanceRecord
)
from apps.hrms.services.leave_service import LeaveService
from apps.hrms.services.leave_allocation_service import LeaveAllocationService


class LeaveServiceDeepTests(TestCase):
    def setUp(self):
        self.org = Organization.objects.create(name="Test Org", business_domain=__import__('apps.organization.models.business_domain_model', fromlist=['BusinessDomain']).BusinessDomain.objects.get_or_create(name='Test Domain ' + __import__('uuid').uuid4().hex[:8], code='TEST' + __import__('uuid').uuid4().hex[:4])[0])
        self.bu = BusinessUnit.objects.create(name="Test BU", organization=self.org)
        self.employee = Employee.objects.create(
            business_unit_id=self.bu.id,
            first_name="Test",
            last_name="User",
            personal_email="test@example.com",
            employee_code="EMP-TEST",
            date_of_joining=date(2026, 1, 1),
            employment_status=Employee.EmploymentStatus.ACTIVE
        )
        self.policy = LeavePolicy.objects.create(business_unit_id=self.bu.id, name="Test Policy")
        
        # Setup Annual Leave (Paid, Requires Approval)
        self.annual_leave = LeaveType.objects.create(
            business_unit_id=self.bu.id,
            policy=self.policy,
            code="AL",
            name="Annual Leave",
            is_paid=True,
            is_lop=False,
            requires_approval=True
        )
        
        # Setup Sick Leave (Allows half day)
        self.sick_leave = LeaveType.objects.create(
            business_unit_id=self.bu.id,
            policy=self.policy,
            code="SL",
            name="Sick Leave",
            is_paid=True,
            allow_half_day=True,
            requires_approval=False
        )
        
        # Setup LOP Leave
        self.lop_leave = LeaveType.objects.create(
            business_unit_id=self.bu.id,
            policy=self.policy,
            code="LOP",
            name="Loss of Pay",
            is_paid=False,
            is_lop=True,
            requires_approval=False
        )

        # Allocate balances
        self.al_balance = LeaveBalance.objects.create(
            business_unit_id=self.bu.id, employee=self.employee, leave_type=self.annual_leave, year=2026,
            opening_balance=Decimal("10.00"), closing_balance=Decimal("10.00")
        )
        self.sl_balance = LeaveBalance.objects.create(
            business_unit_id=self.bu.id, employee=self.employee, leave_type=self.sick_leave, year=2026,
            opening_balance=Decimal("5.00"), closing_balance=Decimal("5.00")
        )
        self.lop_balance = LeaveBalance.objects.create(
            business_unit_id=self.bu.id, employee=self.employee, leave_type=self.lop_leave, year=2026,
            opening_balance=Decimal("0.00"), closing_balance=Decimal("0.00")
        )

    def test_apply_leave_success_and_attendance(self):
        """Test successful leave application and attendance generation if auto-approved."""
        req = LeaveService.apply_leave(
            bu_id=self.bu.id,
            employee_id=self.employee.id,
            leave_type_id=self.sick_leave.id,
            start_date=date(2026, 5, 11),
            end_date=date(2026, 5, 13),
            session=LeaveRequest.SessionChoices.FULL_DAY,
            reason="Sick"
        )
        
        self.assertEqual(req.status, LeaveRequest.StatusChoices.APPROVED)
        
        # Balance should be deducted
        self.sl_balance.refresh_from_db()
        self.assertEqual(self.sl_balance.consumed_days, Decimal("3.00"))
        self.assertEqual(self.sl_balance.closing_balance, Decimal("2.00"))
        
        # Attendance records should be generated
        records = AttendanceRecord.objects.filter(employee=self.employee, status=AttendanceRecord.Status.PAID_LEAVE)
        self.assertEqual(records.count(), 3)

    def test_overlap_validation(self):
        """Test applying for overlapping dates -> Expect Rejected"""
        # Create an approved request
        LeaveRequest.objects.create(
            business_unit_id=self.bu.id, employee=self.employee, leave_type=self.annual_leave,
            start_date=date(2026, 1, 1), end_date=date(2026, 1, 5),
            status=LeaveRequest.StatusChoices.APPROVED
        )
        
        with self.assertRaises(ValidationError) as ctx:
            LeaveService.apply_leave(
                bu_id=self.bu.id, employee_id=self.employee.id, leave_type_id=self.annual_leave.id,
                start_date=date(2026, 1, 3), end_date=date(2026, 1, 7),
                session=LeaveRequest.SessionChoices.FULL_DAY, reason="Overlap"
            )
        self.assertIn("Leave dates overlap", str(ctx.exception))

    def test_restriction_window(self):
        """Test apply during blackout -> Expect Rejected"""
        LeaveRestrictionWindow.objects.create(
            business_unit_id=self.bu.id, name="Financial Close",
            start_date=date(2026, 3, 20), end_date=date(2026, 3, 31)
        )
        
        with self.assertRaises(ValidationError) as ctx:
            LeaveService.apply_leave(
                bu_id=self.bu.id, employee_id=self.employee.id, leave_type_id=self.annual_leave.id,
                start_date=date(2026, 3, 25), end_date=date(2026, 3, 26),
                session=LeaveRequest.SessionChoices.FULL_DAY, reason="During Blackout"
            )
        self.assertIn("blackout period", str(ctx.exception))

    def test_half_day_deduction(self):
        """Test Morning Half -> Expect 0.5 Day Deduction"""
        req = LeaveService.apply_leave(
            bu_id=self.bu.id, employee_id=self.employee.id, leave_type_id=self.sick_leave.id,
            start_date=date(2026, 6, 1), end_date=date(2026, 6, 1),
            session=LeaveRequest.SessionChoices.FIRST_HALF, reason="Half day sick"
        )
        self.assertEqual(req.status, LeaveRequest.StatusChoices.APPROVED)
        
        self.sl_balance.refresh_from_db()
        self.assertEqual(self.sl_balance.consumed_days, Decimal("0.50"))
        self.assertEqual(self.sl_balance.closing_balance, Decimal("4.50"))

    def test_lop_leave(self):
        """Test apply 3 days with 0 balance LOP -> Expect LOP Leave"""
        # Regular leave should fail with 0 balance
        with self.assertRaises(ValidationError):
            LeaveService.apply_leave(
                bu_id=self.bu.id, employee_id=self.employee.id, leave_type_id=self.annual_leave.id,
                start_date=date(2026, 7, 1), end_date=date(2026, 7, 15), # 15 days, balance is 10
                session=LeaveRequest.SessionChoices.FULL_DAY, reason="Too long"
            )
            
        # LOP should succeed even with 0 balance
        req = LeaveService.apply_leave(
            bu_id=self.bu.id, employee_id=self.employee.id, leave_type_id=self.lop_leave.id,
            start_date=date(2026, 8, 3), end_date=date(2026, 8, 5),
            session=LeaveRequest.SessionChoices.FULL_DAY, reason="Emergency LOP"
        )
        self.assertEqual(req.status, LeaveRequest.StatusChoices.APPROVED)
        
        self.lop_balance.refresh_from_db()
        self.assertEqual(self.lop_balance.consumed_days, Decimal("3.00"))
        self.assertEqual(self.lop_balance.closing_balance, Decimal("-3.00"))
        
        # Check attendance records are UNPAID_LEAVE
        records = AttendanceRecord.objects.filter(employee=self.employee, status=AttendanceRecord.Status.UNPAID_LEAVE)
        self.assertEqual(records.count(), 3)
