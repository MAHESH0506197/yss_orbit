# yss_orbit/backend/apps/hrms/tests/test_leave_service_extended.py
"""
Extended LeaveService tests covering:
  - HR-level approval (second approver step)
  - Employee self-cancellation (pending + approved — with balance restore)
  - Manager/HR rejection
  - Rejection/cancel state-machine guards

All tests use db-backed models. Fixtures from conftest.py: tenant_bu, default_user.
"""
from __future__ import annotations

import uuid
from datetime import date, timedelta
from decimal import Decimal

import pytest

from apps.hrms.models import (
    Department,
    Designation,
    Employee,
    LeaveType,
    LeaveBalance,
    LeaveRequest,
    LeaveRequestHistory,
)
from apps.hrms.models.leave_policy import LeavePolicy
from apps.hrms.services.leave_service import LeaveService
from django.core.exceptions import ValidationError


# ── Helpers ──────────────────────────────────────────────────────────────────

def _make_employee(bu, n=1):
    dept = Department.objects.create(business_unit_id=bu.id, name=f"Dept-{n}-{uuid.uuid4().hex[:4]}")
    desig = Designation.objects.create(business_unit_id=bu.id, name=f"Dev-{n}", department=dept)
    return Employee.objects.create(
        business_unit_id=bu.id,
        employee_code=f"EMP-{uuid.uuid4().hex[:6].upper()}",
        first_name=f"User{n}",
        last_name="Test",
        work_email=f"emp{n}-{uuid.uuid4().hex[:4]}@orbit.test",
        department=dept,
        designation=desig,
        date_of_joining=date.today(),
    )


def _make_leave_policy(bu):
    return LeavePolicy.objects.create(
        business_unit_id=bu.id,
        name=f"Policy-{uuid.uuid4().hex[:4]}",
        is_active=True,
    )


def _make_leave_type(bu, requires_approval=True, requires_hr_approval=False, is_lop=False):
    policy = _make_leave_policy(bu)
    return LeaveType.objects.create(
        business_unit_id=bu.id,
        policy=policy,
        name=f"AL-{uuid.uuid4().hex[:4]}",
        code=f"AL{uuid.uuid4().hex[:4].upper()}",
        requires_approval=requires_approval,
        requires_manager_approval=requires_approval,
        requires_hr_approval=requires_hr_approval,
        is_lop=is_lop,
        max_days_per_request=20,
        exclude_weekends=False,
        exclude_holidays=False,
        allow_negative_balance=False,
        requires_attachment=False,
        attachment_after_days=0,
        is_active=True,
    )


def _make_balance(bu, employee, leave_type, opening=10):
    return LeaveBalance.objects.create(
        business_unit_id=bu.id,
        employee_id=employee.id,
        leave_type=leave_type,
        year=date.today().year,
        opening_balance=Decimal(str(opening)),
        consumed_days=Decimal("0.00"),
        closing_balance=Decimal(str(opening)),
    )


# ── HR Approve Tests ──────────────────────────────────────────────────────────

@pytest.mark.django_db
class TestLeaveHRApprove:

    def test_hr_approve_manager_approved_leave(self, tenant_bu, default_user):
        """Full 2-step flow: apply → manager_approve → hr_approve → APPROVED"""
        emp = _make_employee(tenant_bu)
        manager = _make_employee(tenant_bu, n=2)
        hr = _make_employee(tenant_bu, n=3)

        lt = _make_leave_type(tenant_bu, requires_approval=True, requires_hr_approval=True)
        _make_balance(tenant_bu, emp, lt, opening=10)

        # Step 1: Apply
        start = date.today() + timedelta(days=5)
        end = start + timedelta(days=1)
        req = LeaveService.apply_leave(
            bu_id=tenant_bu.id,
            employee_id=emp.id,
            leave_type_id=lt.id,
            start_date=start,
            end_date=end,
            session=LeaveRequest.SessionChoices.FULL_DAY,
            reason="Test leave",
        )
        assert req.status == LeaveRequest.StatusChoices.SUBMITTED

        # Step 2: Manager approves → MANAGER_APPROVED (because HR approval is required)
        req = LeaveService.approve_leave_manager(
            bu_id=tenant_bu.id,
            request_id=req.id,
            manager_id=manager.id,
            comments="Manager approved",
        )
        assert req.status == LeaveRequest.StatusChoices.MANAGER_APPROVED

        # Step 3: HR approves → APPROVED
        req = LeaveService.approve_leave_hr(
            bu_id=tenant_bu.id,
            request_id=req.id,
            hr_id=hr.id,
            comments="HR approved",
        )
        assert req.status == LeaveRequest.StatusChoices.APPROVED
        assert LeaveRequestHistory.objects.filter(leave_request=req).count() == 3

    def test_hr_approve_already_approved_raises(self, tenant_bu, default_user):
        """HR approval of an already-APPROVED leave should raise ValidationError."""
        emp = _make_employee(tenant_bu)
        hr = _make_employee(tenant_bu, n=2)

        lt = _make_leave_type(tenant_bu, requires_approval=False)
        _make_balance(tenant_bu, emp, lt)

        start = date.today() + timedelta(days=3)
        req = LeaveService.apply_leave(
            bu_id=tenant_bu.id,
            employee_id=emp.id,
            leave_type_id=lt.id,
            start_date=start,
            end_date=start,
            session=LeaveRequest.SessionChoices.FULL_DAY,
            reason="Auto-approved",
        )
        # No approval required — already APPROVED
        assert req.status == LeaveRequest.StatusChoices.APPROVED

        with pytest.raises(ValidationError):
            LeaveService.approve_leave_hr(
                bu_id=tenant_bu.id,
                request_id=req.id,
                hr_id=hr.id,
                comments="Duplicate HR approve",
            )


# ── Cancel Leave Tests ────────────────────────────────────────────────────────

@pytest.mark.django_db
class TestLeaveCancel:

    def test_cancel_submitted_leave(self, tenant_bu, default_user):
        """Cancel a SUBMITTED leave — no balance restore needed."""
        emp = _make_employee(tenant_bu)
        lt = _make_leave_type(tenant_bu, requires_approval=True)
        _make_balance(tenant_bu, emp, lt, opening=10)

        start = date.today() + timedelta(days=7)
        req = LeaveService.apply_leave(
            bu_id=tenant_bu.id,
            employee_id=emp.id,
            leave_type_id=lt.id,
            start_date=start,
            end_date=start,
            session=LeaveRequest.SessionChoices.FULL_DAY,
            reason="Cancel test",
        )
        assert req.status == LeaveRequest.StatusChoices.SUBMITTED

        req = LeaveService.cancel_leave(
            bu_id=tenant_bu.id,
            request_id=req.id,
            cancelled_by_id=emp.id,
            reason="Changed plans",
        )
        assert req.status == LeaveRequest.StatusChoices.CANCELLED

    def test_cancel_approved_leave_restores_balance(self, tenant_bu, default_user):
        """Cancel an APPROVED leave — balance must be restored."""
        emp = _make_employee(tenant_bu)
        lt = _make_leave_type(tenant_bu, requires_approval=False)  # auto-approved
        balance = _make_balance(tenant_bu, emp, lt, opening=10)

        start = date.today() + timedelta(days=4)
        end = start + timedelta(days=1)  # 2 days
        req = LeaveService.apply_leave(
            bu_id=tenant_bu.id,
            employee_id=emp.id,
            leave_type_id=lt.id,
            start_date=start,
            end_date=end,
            session=LeaveRequest.SessionChoices.FULL_DAY,
            reason="Will cancel",
        )
        assert req.status == LeaveRequest.StatusChoices.APPROVED
        balance.refresh_from_db()
        assert balance.consumed_days == Decimal("2.00")

        # Cancel it — balance must revert
        LeaveService.cancel_leave(
            bu_id=tenant_bu.id,
            request_id=req.id,
            cancelled_by_id=emp.id,
            reason="Cancel after approval",
        )
        balance.refresh_from_db()
        assert balance.consumed_days == Decimal("0.00")
        assert balance.closing_balance == Decimal("10.00")

    def test_cancel_rejected_leave_raises(self, tenant_bu, default_user):
        """Cannot cancel an already-REJECTED leave."""
        emp = _make_employee(tenant_bu)
        rejector = _make_employee(tenant_bu, n=2)
        lt = _make_leave_type(tenant_bu, requires_approval=True)
        _make_balance(tenant_bu, emp, lt)

        start = date.today() + timedelta(days=6)
        req = LeaveService.apply_leave(
            bu_id=tenant_bu.id,
            employee_id=emp.id,
            leave_type_id=lt.id,
            start_date=start,
            end_date=start,
            session=LeaveRequest.SessionChoices.FULL_DAY,
            reason="Reject then cancel",
        )
        LeaveService.reject_leave(
            bu_id=tenant_bu.id,
            request_id=req.id,
            rejector_id=rejector.id,
            comments="Rejected",
        )
        with pytest.raises(ValidationError):
            LeaveService.cancel_leave(
                bu_id=tenant_bu.id,
                request_id=req.id,
                cancelled_by_id=emp.id,
                reason="Too late",
            )


# ── Reject Leave Tests ────────────────────────────────────────────────────────

@pytest.mark.django_db
class TestLeaveReject:

    def test_reject_submitted_leave(self, tenant_bu, default_user):
        """Manager rejects a SUBMITTED leave → REJECTED."""
        emp = _make_employee(tenant_bu)
        rejector = _make_employee(tenant_bu, n=2)
        lt = _make_leave_type(tenant_bu, requires_approval=True)
        _make_balance(tenant_bu, emp, lt)

        start = date.today() + timedelta(days=8)
        req = LeaveService.apply_leave(
            bu_id=tenant_bu.id,
            employee_id=emp.id,
            leave_type_id=lt.id,
            start_date=start,
            end_date=start,
            session=LeaveRequest.SessionChoices.FULL_DAY,
            reason="Reject test",
        )
        req = LeaveService.reject_leave(
            bu_id=tenant_bu.id,
            request_id=req.id,
            rejector_id=rejector.id,
            comments="Not feasible",
        )
        assert req.status == LeaveRequest.StatusChoices.REJECTED
        history = LeaveRequestHistory.objects.filter(leave_request=req).order_by("created_at")
        assert history.last().status == LeaveRequest.StatusChoices.REJECTED

    def test_reject_approved_leave_raises(self, tenant_bu, default_user):
        """Cannot reject a leave that's already APPROVED."""
        emp = _make_employee(tenant_bu)
        rejector = _make_employee(tenant_bu, n=2)
        lt = _make_leave_type(tenant_bu, requires_approval=False)
        _make_balance(tenant_bu, emp, lt)

        start = date.today() + timedelta(days=2)
        req = LeaveService.apply_leave(
            bu_id=tenant_bu.id,
            employee_id=emp.id,
            leave_type_id=lt.id,
            start_date=start,
            end_date=start,
            session=LeaveRequest.SessionChoices.FULL_DAY,
            reason="Already approved",
        )
        assert req.status == LeaveRequest.StatusChoices.APPROVED

        with pytest.raises(ValidationError):
            LeaveService.reject_leave(
                bu_id=tenant_bu.id,
                request_id=req.id,
                rejector_id=rejector.id,
                comments="Too late",
            )
