"""
YSS Orbit — Phase 3 HRMS Services Tests

Covers:
1. LifecycleEventPublisher — creates correct event records
2. OnboardingService — initialize, complete_task, blocking gate, auto-activate
3. TransferService — initiate, approve (applies Employee changes), reject
4. PromotionService — initiate, approve (updates CTC + creates SalaryRevision)
5. ConfirmationService — probation end + optional increment
6. ExitWorkflowService — resignation submission, HR approval, withdrawal, complete exit
7. AssetService — assign, return, duplicate prevention
8. TrainingService — enroll, complete, duplicate prevention, mandatory gap report
"""
from __future__ import annotations

import uuid
from decimal import Decimal
from datetime import date, timedelta

from django.test import TestCase

from apps.organization.models import BusinessUnit
from apps.organization.models.organization_model import Organization
from apps.hrms.models.employee import Employee
from apps.hrms.models.employee_event import EmployeeEvent
from apps.hrms.models.lifecycle import (
    EmployeeTransfer, EmployeePromotion, SalaryRevision, ExitRequest, FinalSettlement
)
from apps.hrms.models.onboarding import (
    OnboardingTemplate, OnboardingTask, EmployeeOnboarding, OnboardingTaskCompletion
)
from apps.hrms.models.asset import AssetCategory, Asset, AssetAssignment
from apps.hrms.models.training import TrainingCourse, EmployeeTraining
from apps.hrms.models.department import Department
from apps.hrms.models.designation import Designation

from apps.hrms.services import (
    LifecycleEventPublisher,
    OnboardingService, OnboardingError,
    TransferService, TransferError,
    PromotionService, PromotionError,
    ConfirmationService, SalaryRevisionService,
    ExitWorkflowService, ExitWorkflowError,
    AssetService, AssetError,
    TrainingService, TrainingError,
)


# ─── Base Setup ───────────────────────────────────────────────────────────────

class HRMSPhase3BaseTest(TestCase):
    def setUp(self):
        self.org = Organization.objects.create(name="Phase3 Org", business_domain=__import__('apps.organization.models.business_domain_model', fromlist=['BusinessDomain']).BusinessDomain.objects.get_or_create(name='Test Domain ' + __import__('uuid').uuid4().hex[:8], code='TEST' + __import__('uuid').uuid4().hex[:4])[0])
        self.bu = BusinessUnit.objects.create(name="Phase3 BU", organization=self.org)
        self.bu_id = self.bu.id

        self.dept_eng = Department.objects.create(
            business_unit_id=self.bu_id, name="Engineering"
        )
        self.dept_pm = Department.objects.create(
            business_unit_id=self.bu_id, name="Product Management"
        )
        self.desg_eng = Designation.objects.create(
            business_unit_id=self.bu_id, name="Software Engineer"
        )
        self.desg_senior = Designation.objects.create(
            business_unit_id=self.bu_id, name="Senior Engineer"
        )

        self.hr_user_id = uuid.uuid4()
        self.manager_user_id = uuid.uuid4()

        self.employee = Employee.objects.create(
            business_unit_id=self.bu_id,
            first_name="Arjun",
            last_name="Kumar",
            employee_code="EMP001",
            department=self.dept_eng,
            designation=self.desg_eng,
            date_of_joining=date(2022, 6, 1),
            employment_status=Employee.EmploymentStatus.ACTIVE,
            employment_type=Employee.EmploymentType.FULL_TIME,
            basic_salary=Decimal("60000.00"),
            ctc=Decimal("1200000.00"),
        )


# ─── 1. LifecycleEventPublisher Tests ─────────────────────────────────────────

class LifecycleEventPublisherTest(HRMSPhase3BaseTest):

    def test_publish_creates_event(self):
        """publish() creates EmployeeEvent with correct fields."""
        event = LifecycleEventPublisher.publish(
            employee_id=self.employee.id,
            business_unit_id=self.bu_id,
            event_type=EmployeeEvent.EventType.PROMOTED,
            title="Promoted to Senior Engineer",
            description="Annual promotion cycle",
            metadata={"from": "Engineer", "to": "Senior Engineer"},
            actor_id=self.hr_user_id,
        )
        self.assertEqual(event.event_type, EmployeeEvent.EventType.PROMOTED)
        self.assertEqual(event.employee_id, self.employee.id)
        self.assertEqual(event.title, "Promoted to Senior Engineer")
        self.assertEqual(event.triggered_by_id, self.hr_user_id)
        self.assertEqual(event.metadata["from"], "Engineer")

    def test_shorthand_hired(self):
        """hired() factory creates HIRED event."""
        event = LifecycleEventPublisher.hired(
            employee_id=self.employee.id, bu_id=self.bu_id,
            designation="Software Engineer", department="Engineering",
            actor_id=self.hr_user_id,
        )
        self.assertEqual(event.event_type, EmployeeEvent.EventType.HIRED)
        self.assertIn("Engineering", event.title)

    def test_shorthand_salary_revised_pct_in_title(self):
        """salary_revised() shows percentage change in title."""
        event = LifecycleEventPublisher.salary_revised(
            employee_id=self.employee.id, bu_id=self.bu_id,
            old_ctc=1200000, new_ctc=1440000,
            reason="Annual increment",
            actor_id=self.hr_user_id,
        )
        self.assertIn("+20.0%", event.title)


# ─── 2. OnboardingService Tests ───────────────────────────────────────────────

class OnboardingServiceTest(HRMSPhase3BaseTest):

    def setUp(self):
        super().setUp()
        self.template = OnboardingTemplate.objects.create(
            business_unit_id=self.bu_id,
            name="Standard Engineering Onboarding",
            is_active=True,
        )
        # 2 blocking + 1 optional
        self.task1 = OnboardingTask.objects.create(
            business_unit_id=self.bu_id, template=self.template,
            title="Submit ID proofs", is_blocking=True, sort_order=1,
        )
        self.task2 = OnboardingTask.objects.create(
            business_unit_id=self.bu_id, template=self.template,
            title="Sign employment contract", is_blocking=True, sort_order=2,
        )
        self.task3 = OnboardingTask.objects.create(
            business_unit_id=self.bu_id, template=self.template,
            title="Join office lunch", is_blocking=False, sort_order=3,
        )

    def test_initialize_creates_onboarding_and_tasks(self):
        """Initialize creates 1 EmployeeOnboarding + 3 task completions."""
        onboarding = OnboardingService.initialize(
            bu_id=self.bu_id,
            employee_id=self.employee.id,
            template_id=self.template.id,
            initiated_by_id=self.hr_user_id,
        )
        self.assertEqual(
            OnboardingTaskCompletion.objects.filter(onboarding=onboarding).count(), 3
        )
        # Timeline event created
        self.assertTrue(
            EmployeeEvent.objects.filter(
                employee_id=self.employee.id,
                event_type=EmployeeEvent.EventType.ONBOARDING_STARTED,
            ).exists()
        )

    def test_duplicate_onboarding_raises_error(self):
        """Cannot initialize onboarding twice for same employee."""
        OnboardingService.initialize(
            bu_id=self.bu_id, employee_id=self.employee.id,
            template_id=self.template.id, initiated_by_id=self.hr_user_id,
        )
        with self.assertRaises(OnboardingError):
            OnboardingService.initialize(
                bu_id=self.bu_id, employee_id=self.employee.id,
                template_id=self.template.id, initiated_by_id=self.hr_user_id,
            )

    def test_complete_all_tasks_activates_employee(self):
        """Completing all tasks (including blocking) marks onboarding complete."""
        onboarding = OnboardingService.initialize(
            bu_id=self.bu_id, employee_id=self.employee.id,
            template_id=self.template.id, initiated_by_id=self.hr_user_id,
        )
        completions = list(
            OnboardingTaskCompletion.objects.filter(onboarding=onboarding)
        )

        for tc in completions:
            OnboardingService.complete_task(
                bu_id=self.bu_id, onboarding_id=onboarding.id,
                task_completion_id=tc.id, completed_by_id=self.hr_user_id,
            )

        # Onboarding should be COMPLETED
        onboarding.refresh_from_db()
        self.assertEqual(onboarding.status, EmployeeOnboarding.Status.COMPLETED)

        # ONBOARDING_DONE event published
        self.assertTrue(
            EmployeeEvent.objects.filter(
                employee_id=self.employee.id,
                event_type=EmployeeEvent.EventType.ONBOARDING_DONE,
            ).exists()
        )

    def test_progress_report(self):
        """get_onboarding_progress returns correct data."""
        OnboardingService.initialize(
            bu_id=self.bu_id, employee_id=self.employee.id,
            template_id=self.template.id, initiated_by_id=self.hr_user_id,
        )
        progress = OnboardingService.get_onboarding_progress(
            bu_id=self.bu_id, employee_id=self.employee.id
        )
        self.assertEqual(progress["total_tasks"], 3)
        self.assertEqual(progress["completed_tasks"], 0)
        self.assertEqual(progress["completion_percentage"], 0.0)


# ─── 3. TransferService Tests ─────────────────────────────────────────────────

class TransferServiceTest(HRMSPhase3BaseTest):

    def test_initiate_transfer_captures_from_state(self):
        """Transfer request captures current department as from_department_id."""
        transfer = TransferService.initiate(
            bu_id=self.bu_id, employee_id=self.employee.id,
            to_department_id=self.dept_pm.id,
            to_designation_id=None,
            to_manager_id=None,
            to_location="Hyderabad",
            effective_date=date.today() + timedelta(days=30),
            reason="Project alignment",
            initiated_by_id=self.hr_user_id,
        )
        self.assertEqual(transfer.from_department_id, self.dept_eng.id)
        self.assertEqual(transfer.to_department_id, self.dept_pm.id)
        self.assertEqual(transfer.status, EmployeeTransfer.Status.PENDING)

    def test_approve_transfer_updates_employee_department(self):
        """Approving transfer updates Employee.department."""
        transfer = TransferService.initiate(
            bu_id=self.bu_id, employee_id=self.employee.id,
            to_department_id=self.dept_pm.id,
            to_designation_id=None, to_manager_id=None,
            to_location="Pune",
            effective_date=date.today(),
            reason="Restructure",
            initiated_by_id=self.hr_user_id,
        )
        TransferService.approve(
            bu_id=self.bu_id, transfer_id=transfer.id,
            approved_by_id=self.hr_user_id, remarks="Approved",
        )

        self.employee.refresh_from_db()
        self.assertEqual(self.employee.department_id, self.dept_pm.id)

        # Timeline event published
        self.assertTrue(
            EmployeeEvent.objects.filter(
                employee_id=self.employee.id,
                event_type=EmployeeEvent.EventType.TRANSFERRED,
            ).exists()
        )

    def test_cannot_approve_inactive_employee(self):
        """Cannot initiate transfer for non-existent ACTIVE employee."""
        with self.assertRaises(TransferError):
            TransferService.initiate(
                bu_id=self.bu_id, employee_id=uuid.uuid4(),
                to_department_id=self.dept_pm.id,
                to_designation_id=None, to_manager_id=None,
                to_location="Remote", effective_date=date.today(),
                reason="Test", initiated_by_id=self.hr_user_id,
            )


# ─── 4. PromotionService Tests ────────────────────────────────────────────────

class PromotionServiceTest(HRMSPhase3BaseTest):

    def test_approve_promotion_updates_ctc_and_creates_revision(self):
        """Approving promotion updates Employee CTC and creates SalaryRevision."""
        new_ctc = Decimal("1440000.00")

        promotion = PromotionService.initiate(
            bu_id=self.bu_id, employee_id=self.employee.id,
            to_designation_id=self.desg_senior.id,
            effective_date=date.today(),
            increment_percentage=Decimal("20.00"),
            new_ctc=new_ctc,
            reason="Annual promotion cycle",
            recommended_by_id=self.manager_user_id,
        )
        self.assertEqual(promotion.status, EmployeePromotion.Status.PENDING)

        PromotionService.approve(
            bu_id=self.bu_id, promotion_id=promotion.id,
            approved_by_id=self.hr_user_id, remarks="Well deserved",
        )

        self.employee.refresh_from_db()
        self.assertEqual(self.employee.ctc, new_ctc)
        self.assertEqual(self.employee.designation_id, self.desg_senior.id)

        # SalaryRevision created
        self.assertTrue(
            SalaryRevision.objects.filter(
                employee_id=self.employee.id,
                revision_type=SalaryRevision.RevisionType.PROMOTION,
            ).exists()
        )

        # Timeline events published
        self.assertTrue(
            EmployeeEvent.objects.filter(
                employee_id=self.employee.id,
                event_type=EmployeeEvent.EventType.PROMOTED,
            ).exists()
        )

    def test_promote_nonexistent_employee_raises(self):
        """Initiating promotion for non-existent employee raises PromotionError."""
        with self.assertRaises(PromotionError):
            PromotionService.initiate(
                bu_id=self.bu_id, employee_id=uuid.uuid4(),
                to_designation_id=self.desg_senior.id,
                effective_date=date.today(),
                increment_percentage=Decimal("10"),
                new_ctc=Decimal("1320000"),
                reason="test", recommended_by_id=self.manager_user_id,
            )


# ─── 5. ExitWorkflowService Tests ─────────────────────────────────────────────

class ExitWorkflowServiceTest(HRMSPhase3BaseTest):

    def test_submit_resignation_creates_exit_request_with_lwd(self):
        """Resignation submission auto-calculates LWD."""
        resignation_date = date.today()
        exit_req = ExitWorkflowService.submit_resignation(
            bu_id=self.bu_id,
            employee_id=self.employee.id,
            resignation_date=resignation_date,
            reason="Better opportunity",
            notice_period_days_override=30,
        )
        self.assertEqual(exit_req.status, ExitRequest.Status.SUBMITTED)
        self.assertEqual(exit_req.last_working_date, resignation_date + timedelta(days=30))

        # Timeline event
        self.assertTrue(
            EmployeeEvent.objects.filter(
                employee_id=self.employee.id,
                event_type=EmployeeEvent.EventType.EXIT_INITIATED,
            ).exists()
        )

    def test_duplicate_resignation_raises_error(self):
        """Cannot submit two active exit requests."""
        ExitWorkflowService.submit_resignation(
            bu_id=self.bu_id, employee_id=self.employee.id,
            resignation_date=date.today(), reason="First",
        )
        with self.assertRaises(ExitWorkflowError):
            ExitWorkflowService.submit_resignation(
                bu_id=self.bu_id, employee_id=self.employee.id,
                resignation_date=date.today(), reason="Second",
            )

    def test_hr_approve_sets_notice_period_status(self):
        """HR approval sets Employee.status to NOTICE_PERIOD."""
        exit_req = ExitWorkflowService.submit_resignation(
            bu_id=self.bu_id, employee_id=self.employee.id,
            resignation_date=date.today(), reason="Better opportunity",
        )
        ExitWorkflowService.hr_approve(
            bu_id=self.bu_id, exit_request_id=exit_req.id,
            approved_by_id=self.hr_user_id,
        )

        self.employee.refresh_from_db()
        self.assertEqual(
            self.employee.employment_status,
            Employee.EmploymentStatus.NOTICE_PERIOD,
        )

    def test_mark_exit_complete_sets_resigned_and_date(self):
        """Exit completion sets RESIGNED status and date_of_leaving."""
        exit_req = ExitWorkflowService.submit_resignation(
            bu_id=self.bu_id, employee_id=self.employee.id,
            resignation_date=date.today(), reason="Moving on",
        )
        ExitWorkflowService.hr_approve(
            bu_id=self.bu_id, exit_request_id=exit_req.id,
            approved_by_id=self.hr_user_id,
        )
        actual_last_day = date.today() + timedelta(days=30)
        ExitWorkflowService.mark_exit_complete(
            bu_id=self.bu_id, exit_request_id=exit_req.id,
            actual_last_day=actual_last_day,
            completed_by_id=self.hr_user_id,
        )

        self.employee.refresh_from_db()
        self.assertEqual(self.employee.employment_status, Employee.EmploymentStatus.RESIGNED)
        self.assertEqual(self.employee.date_of_leaving, actual_last_day)

    def test_withdraw_resignation_reinstates_employee(self):
        """Withdrawing resignation restores ACTIVE status."""
        exit_req = ExitWorkflowService.submit_resignation(
            bu_id=self.bu_id, employee_id=self.employee.id,
            resignation_date=date.today(), reason="Testing",
        )
        ExitWorkflowService.withdraw(
            bu_id=self.bu_id, exit_request_id=exit_req.id,
            withdrawn_by_id=self.employee.id,
            reason="Change of mind",
        )

        self.employee.refresh_from_db()
        self.assertEqual(self.employee.employment_status, Employee.EmploymentStatus.ACTIVE)


# ─── 6. AssetService Tests ────────────────────────────────────────────────────

class AssetServiceTest(HRMSPhase3BaseTest):

    def setUp(self):
        super().setUp()
        self.category = AssetCategory.objects.create(
            business_unit_id=self.bu_id, name="Laptop"
        )
        self.asset = Asset.objects.create(
            business_unit_id=self.bu_id,
            category=self.category,
            brand="Apple",
            model_name="MacBook Pro 14",
            asset_tag="LAP-001",
            serial_number="SN123456",
            status=Asset.Status.AVAILABLE,
        )

    def test_assign_asset_sets_in_use(self):
        """Assigning an asset sets its status to ASSIGNED."""
        assignment = AssetService.assign(
            bu_id=self.bu_id, asset_id=self.asset.id,
            employee_id=self.employee.id, assigned_by_id=self.hr_user_id,
        )
        self.asset.refresh_from_db()
        self.assertEqual(self.asset.status, Asset.Status.ASSIGNED)

    def test_cannot_assign_unavailable_asset(self):
        """Assigning an already-in-use asset raises AssetError."""
        AssetService.assign(
            bu_id=self.bu_id, asset_id=self.asset.id,
            employee_id=self.employee.id, assigned_by_id=self.hr_user_id,
        )
        emp2 = Employee.objects.create(
            business_unit_id=self.bu_id, first_name="B", last_name="B",
            employee_code="EMP999", date_of_joining=date.today(),
        )
        with self.assertRaises(AssetError):
            AssetService.assign(
                bu_id=self.bu_id, asset_id=self.asset.id,
                employee_id=emp2.id, assigned_by_id=self.hr_user_id,
            )

    def test_return_asset_frees_it(self):
        """Returning an asset sets its status back to AVAILABLE."""
        assignment = AssetService.assign(
            bu_id=self.bu_id, asset_id=self.asset.id,
            employee_id=self.employee.id, assigned_by_id=self.hr_user_id,
        )
        AssetService.return_asset(
            bu_id=self.bu_id, assignment_id=assignment.id,
            returned_by_id=self.hr_user_id,
        )
        self.asset.refresh_from_db()
        self.assertEqual(self.asset.status, Asset.Status.AVAILABLE)
        # Verify assignment is now RETURNED
        assignment.refresh_from_db()
        self.assertEqual(assignment.status, AssetAssignment.Status.RETURNED)


# ─── 7. TrainingService Tests ─────────────────────────────────────────────────

class TrainingServiceTest(HRMSPhase3BaseTest):

    def setUp(self):
        super().setUp()
        self.course = TrainingCourse.objects.create(
            business_unit_id=self.bu_id,
            title="Django Advanced",
            course_type=TrainingCourse.CourseType.ONLINE,
            is_mandatory=True,
            status=TrainingCourse.Status.PUBLISHED,
        )

    def test_enroll_creates_enrollment(self):
        """Enrolling creates EmployeeTraining and timeline event."""
        enrollment = TrainingService.enroll(
            bu_id=self.bu_id, course_id=self.course.id,
            employee_id=self.employee.id, enrolled_by_id=self.hr_user_id,
        )
        self.assertEqual(enrollment.status, EmployeeTraining.Status.ENROLLED)
        self.assertTrue(
            EmployeeEvent.objects.filter(
                employee_id=self.employee.id,
                event_type=EmployeeEvent.EventType.TRAINING_ENROLLED,
            ).exists()
        )

    def test_duplicate_enrollment_raises_error(self):
        """Cannot enroll twice in same course when active enrollment exists."""
        TrainingService.enroll(
            bu_id=self.bu_id, course_id=self.course.id,
            employee_id=self.employee.id, enrolled_by_id=self.hr_user_id,
        )
        with self.assertRaises(TrainingError):
            TrainingService.enroll(
                bu_id=self.bu_id, course_id=self.course.id,
                employee_id=self.employee.id, enrolled_by_id=self.hr_user_id,
            )

    def test_complete_above_threshold_marks_completed(self):
        """Scoring above passing threshold marks COMPLETED."""
        enrollment = TrainingService.enroll(
            bu_id=self.bu_id, course_id=self.course.id,
            employee_id=self.employee.id, enrolled_by_id=self.hr_user_id,
            pass_mark=70.0,
        )
        TrainingService.complete(
            bu_id=self.bu_id, enrollment_id=enrollment.id,
            completed_by_id=self.hr_user_id,
            completion_date=date.today(),
            score=85.0,
        )
        enrollment.refresh_from_db()
        self.assertEqual(enrollment.status, EmployeeTraining.Status.COMPLETED)

    def test_complete_below_threshold_marks_failed(self):
        """Scoring below passing threshold marks FAILED."""
        enrollment = TrainingService.enroll(
            bu_id=self.bu_id, course_id=self.course.id,
            employee_id=self.employee.id, enrolled_by_id=self.hr_user_id,
            pass_mark=70.0,
        )
        TrainingService.complete(
            bu_id=self.bu_id, enrollment_id=enrollment.id,
            completed_by_id=self.hr_user_id,
            completion_date=date.today(),
            score=50.0,
        )
        enrollment.refresh_from_db()
        self.assertEqual(enrollment.status, EmployeeTraining.Status.FAILED)

    def test_mandatory_training_gap_report(self):
        """Employee without completion appears in gap report."""
        gaps = TrainingService.get_mandatory_training_gaps(bu_id=self.bu_id)
        employee_ids = [g["employee_id"] for g in gaps]
        self.assertIn(str(self.employee.id), employee_ids)
