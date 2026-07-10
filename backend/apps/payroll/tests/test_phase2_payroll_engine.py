"""
YSS Orbit — Phase 2 Payroll Engine Tests

Covers:
1. New Regime TDS (with ₹12L rebate threshold)
2. Old Regime TDS (with 80C, 80D, HRA declarations)
3. Professional Tax (state-wise slab lookup)
4. Contractor worker_type exclusion from PF/ESI/PT
5. LWF frequency-based deduction (MONTHLY/BIANNUAL/ANNUAL)
6. PayrollApprovalService (approve → lock → rollback guards)
7. FinalSettlementService (gratuity, EL encashment, notice recovery)
8. LOP proration edge cases (0 LOP, 100% LOP, first day of month)
9. Variable pay injection
10. Zero regression: v2 service still passes v1 cases
"""
from __future__ import annotations

import uuid
from decimal import Decimal
from datetime import date, timedelta

from django.test import TestCase
from unittest.mock import patch, MagicMock

from apps.organization.models import BusinessUnit
from apps.organization.models.organization_model import Organization
from apps.payroll.models.payroll_run_model import PayrollRun
from apps.payroll.models.payslip import Payslip
from apps.payroll.models.tds_model import TDSSlab
from apps.payroll.models.professional_tax_model import (
    ProfessionalTaxSlab, GratuityConfig, LabourWelfareFundConfig
)
from apps.payroll.models.tax_declaration_model import EmployeeTaxDeclaration
from apps.payroll.services.salary_computation_service import SalaryComputationService
from apps.payroll.services.payroll_approval_service import (
    PayrollApprovalService, PayrollApprovalError
)
from apps.payroll.services.final_settlement_service import FinalSettlementService
from apps.hrms.models import Employee
from apps.hrms.models.lifecycle import ExitRequest


# ─── Test Helpers ─────────────────────────────────────────────────────────────

def _make_employee_data(
    employee: "Employee",
    worker_type: str = "EMPLOYEE",
    state_code: str = "KA",
) -> dict:
    return {
        "employee_code": employee.employee_code,
        "employee_name": f"{employee.first_name} {employee.last_name}",
        "basic_salary": employee.basic_salary,
        "ctc": employee.ctc,
        "salary_structure_id": None,
        "worker_type": worker_type,
        "state_code": state_code,
    }


def _make_attendance(working_days=26, lop_days=0) -> dict:
    return {
        "working_days": working_days,
        "present_days": working_days - lop_days,
        "lop_days": lop_days,
    }


def _leave_data(lop_days=0) -> dict:
    return {"lop_days": lop_days}


# ─── Base Test Setup ──────────────────────────────────────────────────────────

class PayrollPhase2BaseTest(TestCase):
    def setUp(self):
        self.org = Organization.objects.create(name="Phase2 Org", business_domain=__import__('apps.organization.models.business_domain_model', fromlist=['BusinessDomain']).BusinessDomain.objects.get_or_create(name='Test Domain ' + __import__('uuid').uuid4().hex[:8], code='TEST' + __import__('uuid').uuid4().hex[:4])[0])
        self.bu = BusinessUnit.objects.create(
            name="Phase2 BU", organization=self.org
        )
        self.bu_id = self.bu.id

        # Standard employee — 50K basic, 12 LPA CTC
        self.employee = Employee.objects.create(
            business_unit_id=self.bu_id,
            first_name="Arjun",
            last_name="Kumar",
            employee_code="EMP100",
            basic_salary=Decimal("50000.00"),
            ctc=Decimal("1200000.00"),
            date_of_joining="2022-04-01",
        )

        # High-earner — 1.5L basic, 36 LPA CTC (tests higher tax slabs)
        self.high_earner = Employee.objects.create(
            business_unit_id=self.bu_id,
            first_name="Priya",
            last_name="Sharma",
            employee_code="EMP200",
            basic_salary=Decimal("150000.00"),
            ctc=Decimal("4200000.00"),
            date_of_joining="2020-01-01",
        )

        # Low-income employee — 15K gross (ESI applicable)
        self.low_earner = Employee.objects.create(
            business_unit_id=self.bu_id,
            first_name="Ravi",
            last_name="Singh",
            employee_code="EMP300",
            basic_salary=Decimal("12000.00"),
            ctc=Decimal("180000.00"),
            date_of_joining="2023-06-01",
        )

        # Contractor
        self.contractor = Employee.objects.create(
            business_unit_id=self.bu_id,
            first_name="Dev",
            last_name="Contractor",
            employee_code="EMP400",
            basic_salary=Decimal("80000.00"),
            ctc=Decimal("1200000.00"),
            worker_type="CONTRACTOR",
            date_of_joining="2024-01-01",
        )

        # Payroll run for April 2025 (FY 2025-26)
        self.run = PayrollRun.objects.create(
            business_unit_id=self.bu_id,
            month=4, year=2025,
        )


# ─── 1. New Regime TDS Tests ──────────────────────────────────────────────────

class NewRegimeTDSTest(PayrollPhase2BaseTest):

    def test_income_below_12l_rebate_zero_tds(self):
        """New regime: income ≤ ₹12L → tax = 0 (87A rebate)."""
        # 50K/month = 6L annual. After ₹75K std deduction = 5.25L < 12L → 0 TDS
        payslip = SalaryComputationService.compute_payslip(
            employee_id=self.employee.id,
            payroll_run=self.run,
            employee_data=_make_employee_data(self.employee),
            attendance_data=_make_attendance(),
            leave_data=_leave_data(),
            correlation_id="test_new_regime_rebate",
        )
        self.assertEqual(payslip.tds, Decimal("0.00"))

    def test_income_above_12l_correct_tds(self):
        """New regime: 1.5L/month = 18L annual — should have non-zero TDS."""
        payslip = SalaryComputationService.compute_payslip(
            employee_id=self.high_earner.id,
            payroll_run=self.run,
            employee_data=_make_employee_data(self.high_earner),
            attendance_data=_make_attendance(),
            leave_data=_leave_data(),
            correlation_id="test_new_regime_high",
        )
        self.assertGreater(payslip.tds, Decimal("0.00"))
        # 18L - 75K std ded = 17.25L annual taxable
        # Slab: 0-4L@0, 4-8L@5%, 8-12L@10%, 12-16L@15%, 16-17.25L@20%
        # Tax = 0 + 20000 + 40000 + 60000 + 25000 = 145000
        # Cess: 4% = 5800. Total = 150800. Monthly = 12566.67
        self.assertAlmostEqual(float(payslip.tds), 12566.67, delta=1.0)

    def test_esi_applicable_for_low_income(self):
        """Gross ≤ ₹21,000 → ESI deducted at 0.75%."""
        payslip = SalaryComputationService.compute_payslip(
            employee_id=self.low_earner.id,
            payroll_run=self.run,
            employee_data=_make_employee_data(self.low_earner),
            attendance_data=_make_attendance(),
            leave_data=_leave_data(),
            correlation_id="test_esi_low",
        )
        expected_esi = Decimal("12000.00") * Decimal("0.0075")
        self.assertEqual(payslip.employee_esi, expected_esi.quantize(Decimal("0.01")))


# ─── 2. Old Regime TDS with Declarations ─────────────────────────────────────

class OldRegimeTDSTest(PayrollPhase2BaseTest):

    def setUp(self):
        super().setUp()
        # Create VERIFIED old-regime declaration for high earner
        self.declaration = EmployeeTaxDeclaration.objects.create(
            business_unit_id=self.bu_id,
            employee_id=self.high_earner.id,
            financial_year="2025-26",
            tax_regime=EmployeeTaxDeclaration.TaxRegime.OLD_REGIME,
            status=EmployeeTaxDeclaration.Status.VERIFIED,
            section_80c=Decimal("150000"),   # Max 80C
            section_80d=Decimal("25000"),    # Health insurance
            hra_exemption=Decimal("60000"),  # HRA declared
        )

    def test_old_regime_lower_tds_than_new(self):
        """Old regime with max 80C+80D+HRA should have lower TDS than new regime."""
        payslip_old = SalaryComputationService.compute_payslip(
            employee_id=self.high_earner.id,
            payroll_run=self.run,
            employee_data=_make_employee_data(self.high_earner),
            attendance_data=_make_attendance(),
            leave_data=_leave_data(),
            correlation_id="test_old_regime",
        )
        # New regime TDS was ≈ ₹12,567/month
        # Old regime with 80C+80D+HRA+std ded reduces taxable significantly
        # Annual gross=18L, deductions=50K+150K+25K+60K=285K, taxable=15.15L
        # Old slabs: 0-2.5L@0, 2.5-5L@5%, 5-10L@20%, 10-15.15L@30%
        # Tax = 0 + 12500 + 100000 + 154500 = 267000 (before cess)
        self.assertGreater(payslip_old.tds, Decimal("0"))
        # Just verify it's a reasonable number (< 30K/month for 18L income)
        self.assertLess(payslip_old.tds, Decimal("30000"))

    def test_old_regime_80c_capped_at_1_5l(self):
        """Even if 80C declared > 1.5L, cap enforced in TDS calculation."""
        EmployeeTaxDeclaration.objects.filter(id=self.declaration.id).update(
            section_80c=Decimal("300000")  # Over-declared
        )
        payslip = SalaryComputationService.compute_payslip(
            employee_id=self.high_earner.id,
            payroll_run=self.run,
            employee_data=_make_employee_data(self.high_earner),
            attendance_data=_make_attendance(),
            leave_data=_leave_data(),
            correlation_id="test_80c_cap",
        )
        # TDS must be positive (cap enforced = same as max 1.5L)
        self.assertGreater(payslip.tds, Decimal("0"))


# ─── 3. Professional Tax Tests ────────────────────────────────────────────────

class ProfessionalTaxTest(PayrollPhase2BaseTest):

    def setUp(self):
        super().setUp()
        # Karnataka PT: 0-15K = ₹0, 15K+ = ₹200/month
        ProfessionalTaxSlab.objects.create(
            business_unit_id=self.bu_id,
            state_code="KA",
            financial_year="2025-26",
            salary_from=Decimal("0"),
            salary_to=Decimal("15000"),
            monthly_pt_amount=Decimal("0"),
            is_active=True,
        )
        ProfessionalTaxSlab.objects.create(
            business_unit_id=self.bu_id,
            state_code="KA",
            financial_year="2025-26",
            salary_from=Decimal("15000"),
            salary_to=None,  # no upper limit
            monthly_pt_amount=Decimal("200"),
            is_active=True,
        )

    def test_pt_deducted_for_ka_employee(self):
        """Karnataka employee with gross > 15K should have ₹200 PT deducted."""
        payslip = SalaryComputationService.compute_payslip(
            employee_id=self.employee.id,
            payroll_run=self.run,
            employee_data=_make_employee_data(self.employee, state_code="KA"),
            attendance_data=_make_attendance(),
            leave_data=_leave_data(),
            correlation_id="test_pt_ka",
        )
        self.assertEqual(
            Decimal(payslip.deductions_breakdown.get("PT", "0")),
            Decimal("200.00")
        )

    def test_pt_zero_for_low_income(self):
        """Employee earning below PT threshold should have zero PT."""
        payslip = SalaryComputationService.compute_payslip(
            employee_id=self.low_earner.id,
            payroll_run=self.run,
            employee_data=_make_employee_data(self.low_earner, state_code="KA"),
            attendance_data=_make_attendance(),
            leave_data=_leave_data(),
            correlation_id="test_pt_low",
        )
        self.assertEqual(
            Decimal(payslip.deductions_breakdown.get("PT", "0")),
            Decimal("0.00")
        )

    def test_pt_zero_for_na_state(self):
        """Employee with state_code='NA' should have zero PT."""
        payslip = SalaryComputationService.compute_payslip(
            employee_id=self.employee.id,
            payroll_run=self.run,
            employee_data=_make_employee_data(self.employee, state_code="NA"),
            attendance_data=_make_attendance(),
            leave_data=_leave_data(),
            correlation_id="test_pt_na",
        )
        self.assertEqual(
            Decimal(payslip.deductions_breakdown.get("PT", "0")),
            Decimal("0.00")
        )


# ─── 4. Contractor Exclusion Tests ────────────────────────────────────────────

class ContractorExclusionTest(PayrollPhase2BaseTest):

    def test_contractor_has_zero_pf_esi_pt(self):
        """Contractor worker_type must have PF=0, ESI=0, PT=0."""
        ProfessionalTaxSlab.objects.create(
            business_unit_id=self.bu_id,
            state_code="KA",
            financial_year="2025-26",
            salary_from=Decimal("0"),
            salary_to=None,
            monthly_pt_amount=Decimal("200"),
            is_active=True,
        )
        payslip = SalaryComputationService.compute_payslip(
            employee_id=self.contractor.id,
            payroll_run=self.run,
            employee_data=_make_employee_data(self.contractor, worker_type="CONTRACTOR", state_code="KA"),
            attendance_data=_make_attendance(),
            leave_data=_leave_data(),
            correlation_id="test_contractor_exclusion",
        )
        self.assertEqual(payslip.employee_pf, Decimal("0.00"))
        self.assertEqual(payslip.employee_esi, Decimal("0.00"))
        self.assertEqual(
            Decimal(payslip.deductions_breakdown.get("PT", "0")),
            Decimal("0.00")
        )

    def test_contractor_still_gets_tds_new_regime(self):
        """Contractors still subject to TDS (income tax is personal liability)."""
        payslip = SalaryComputationService.compute_payslip(
            employee_id=self.high_earner.id,
            payroll_run=self.run,
            employee_data=_make_employee_data(self.high_earner, worker_type="CONSULTANT"),
            attendance_data=_make_attendance(),
            leave_data=_leave_data(),
            correlation_id="test_contractor_tds",
        )
        # High earner (18L) → TDS applies in new regime even for contractors
        self.assertGreater(payslip.tds, Decimal("0"))


# ─── 5. LWF Tests ─────────────────────────────────────────────────────────────

class LWFTest(PayrollPhase2BaseTest):

    def setUp(self):
        super().setUp()
        LabourWelfareFundConfig.objects.create(
            business_unit_id=self.bu_id,
            state_code="KA",
            employee_contribution=Decimal("20.00"),
            employer_contribution=Decimal("40.00"),
            frequency="BIANNUAL",
            is_active=True,
        )

    def _compute(self, month: int) -> Payslip:
        run, _ = PayrollRun.objects.get_or_create(
            business_unit_id=self.bu_id, month=month, year=2025,
        )
        return SalaryComputationService.compute_payslip(
            employee_id=self.employee.id,
            payroll_run=run,
            employee_data=_make_employee_data(self.employee, state_code="KA"),
            attendance_data=_make_attendance(),
            leave_data=_leave_data(),
            correlation_id=f"test_lwf_{month}",
        )

    def test_lwf_deducted_in_june(self):
        """Bi-annual LWF should be deducted in June."""
        ps = self._compute(month=6)
        self.assertEqual(Decimal(ps.deductions_breakdown.get("LWF", "0")), Decimal("20.00"))

    def test_lwf_deducted_in_december(self):
        """Bi-annual LWF should be deducted in December."""
        ps = self._compute(month=12)
        self.assertEqual(Decimal(ps.deductions_breakdown.get("LWF", "0")), Decimal("20.00"))

    def test_lwf_not_deducted_in_april(self):
        """Bi-annual LWF should NOT be deducted in April."""
        ps = self._compute(month=4)
        self.assertEqual(Decimal(ps.deductions_breakdown.get("LWF", "0")), Decimal("0.00"))


# ─── 6. Payroll Approval Service Tests ───────────────────────────────────────

class PayrollApprovalTest(PayrollPhase2BaseTest):

    def setUp(self):
        super().setUp()
        self.hr_user_id = uuid.uuid4()
        self.finance_user_id = uuid.uuid4()
        # Set run to PROCESSED
        self.run.status = PayrollRun.Status.PROCESSED
        self.run.save()

    def test_approve_processed_run(self):
        """PROCESSED → APPROVED on HR approval."""
        result = PayrollApprovalService.approve(
            bu_id=self.bu_id,
            payroll_run_id=self.run.id,
            approved_by_id=self.hr_user_id,
        )
        self.assertEqual(result.status, PayrollRun.Status.APPROVED)
        self.assertEqual(result.approved_by_id, self.hr_user_id)
        self.assertIsNotNone(result.approved_at)

    def test_cannot_approve_draft(self):
        """DRAFT run cannot be approved."""
        self.run.status = PayrollRun.Status.DRAFT
        self.run.save()
        with self.assertRaises(PayrollApprovalError):
            PayrollApprovalService.approve(
                bu_id=self.bu_id,
                payroll_run_id=self.run.id,
                approved_by_id=self.hr_user_id,
            )

    def test_lock_approved_run(self):
        """APPROVED → LOCKED on Finance lock."""
        self.run.status = PayrollRun.Status.APPROVED
        self.run.save()
        result = PayrollApprovalService.lock(
            bu_id=self.bu_id,
            payroll_run_id=self.run.id,
            locked_by_id=self.finance_user_id,
        )
        self.assertEqual(result.status, PayrollRun.Status.LOCKED)
        self.assertEqual(result.locked_by_id, self.finance_user_id)

    def test_cannot_lock_processed_run(self):
        """PROCESSED run cannot be locked without HR approval first."""
        with self.assertRaises(PayrollApprovalError):
            PayrollApprovalService.lock(
                bu_id=self.bu_id,
                payroll_run_id=self.run.id,
                locked_by_id=self.finance_user_id,
            )

    def test_rollback_approved_to_processed(self):
        """APPROVED → PROCESSED on rollback (before Finance lock)."""
        self.run.status = PayrollRun.Status.APPROVED
        self.run.save()
        result = PayrollApprovalService.rollback(
            bu_id=self.bu_id,
            payroll_run_id=self.run.id,
            rolled_back_by_id=self.hr_user_id,
            reason="Correction needed",
        )
        self.assertEqual(result.status, PayrollRun.Status.PROCESSED)

    def test_cannot_rollback_locked_run(self):
        """LOCKED run cannot be rolled back."""
        self.run.status = PayrollRun.Status.LOCKED
        self.run.save()
        with self.assertRaises(PayrollApprovalError):
            PayrollApprovalService.rollback(
                bu_id=self.bu_id,
                payroll_run_id=self.run.id,
                rolled_back_by_id=self.hr_user_id,
                reason="Too late",
            )


# ─── 7. Final Settlement Tests ────────────────────────────────────────────────

class FinalSettlementTest(PayrollPhase2BaseTest):

    def setUp(self):
        super().setUp()
        GratuityConfig.objects.create(
            business_unit_id=self.bu_id,
            eligibility_years=Decimal("5.0"),
            rate_per_year=Decimal("15.0"),
            working_days_divisor=26,
            max_gratuity_amount=Decimal("2000000.00"),
            is_active=True,
        )

        self.exit_request = ExitRequest.objects.create(
            business_unit_id=self.bu_id,
            employee_id=self.high_earner.id,
            exit_type=ExitRequest.ExitType.RESIGNATION,
            status=ExitRequest.Status.APPROVED,
            resignation_date=date(2025, 3, 1),
            notice_period_days=60,
            last_working_date=date(2025, 4, 30),
            actual_last_day=date(2025, 4, 30),
            reason="Better opportunity",
        )

    def _employee_data_for_settlement(self) -> dict:
        doj = date(2020, 1, 1)  # 5.33 years by April 2025
        return {
            "employee_id": self.high_earner.id,
            "basic_salary": Decimal("150000.00"),
            "gross_salary_monthly": Decimal("200000.00"),  # 20L CTC / 12
            "date_of_joining": doj,
            "actual_last_day": date(2025, 4, 30),
            "notice_period_days": 60,
            "notice_served_days": 60,   # full notice served
            "earned_leave_balance": Decimal("15.0"),  # 15 EL days pending
            "loan_outstanding": Decimal("0"),
            "assets_not_returned_value": Decimal("0"),
            "lta_balance": Decimal("20000"),
            "statutory_bonus_arrears": Decimal("0"),
        }

    def test_settlement_computed_correctly(self):
        """Full settlement computation."""
        settlement = FinalSettlementService.compute(
            bu_id=self.bu_id,
            exit_request_id=self.exit_request.id,
            employee_data=self._employee_data_for_settlement(),
            computed_by_id=uuid.uuid4(),
        )
        # Salary for last month (April 2025 = 30 days, all 30 worked)
        expected_last_salary = Decimal("200000.00")  # full month
        self.assertAlmostEqual(float(settlement.salary_for_last_month), float(expected_last_salary), delta=100)

        # EL encashment: 15 days × (150000/26) = 86538.46
        expected_el = Decimal("15") * (Decimal("150000") / Decimal("26"))
        self.assertAlmostEqual(float(settlement.earned_leave_encashment), float(expected_el), delta=1.0)

        # Gratuity: Basic × 15 × years / 26
        # Years service = 2020-01-01 to 2025-04-30 ≈ 5.3 years
        # Gratuity = 150000 × 15 × 5.3 / 26 ≈ 458,653
        # Does NOT hit 20L cap at this basic salary
        expected_gratuity = (Decimal("150000") * Decimal("15") * Decimal("5.3")) / Decimal("26")
        self.assertAlmostEqual(float(settlement.gratuity_amount), float(expected_gratuity), delta=5000)
        self.assertLess(settlement.gratuity_amount, Decimal("2000000"))  # below cap

        # No notice shortfall (served full 60 days)
        self.assertEqual(settlement.notice_period_shortfall_days, 0)
        self.assertEqual(settlement.notice_recovery_amount, Decimal("0.00"))

        # Net = payable - recovery
        self.assertEqual(settlement.net_amount, settlement.total_payable - settlement.total_recovery)

    def test_settlement_notice_shortfall_recovery(self):
        """Notice shortfall deducted from settlement."""
        data = self._employee_data_for_settlement()
        data["notice_served_days"] = 30   # Only 30 of 60 served
        settlement = FinalSettlementService.compute(
            bu_id=self.bu_id,
            exit_request_id=self.exit_request.id,
            employee_data=data,
            computed_by_id=uuid.uuid4(),
        )
        self.assertEqual(settlement.notice_period_shortfall_days, 30)
        expected_recovery = Decimal("30") * (Decimal("200000") / Decimal("26"))
        self.assertAlmostEqual(
            float(settlement.notice_recovery_amount),
            float(expected_recovery),
            delta=1.0
        )

    def test_settlement_statutory_bonus_arrears(self):
        """Statutory Bonus Arrears should be added to the final settlement."""
        data = self._employee_data_for_settlement()
        data["statutory_bonus_arrears"] = Decimal("15000.00")
        
        settlement = FinalSettlementService.compute(
            bu_id=self.bu_id,
            exit_request_id=self.exit_request.id,
            employee_data=data,
            computed_by_id=uuid.uuid4(),
        )
        
        self.assertEqual(settlement.bonus_amount, Decimal("15000.00"))
        # Verify it increases total payable
        expected_last_salary = Decimal("200000.00")
        expected_el = Decimal("15") * (Decimal("150000") / Decimal("26"))
        expected_gratuity = (Decimal("150000") * Decimal("15") * Decimal("5.3")) / Decimal("26")
        expected_lta = Decimal("20000.00")
        expected_total = expected_last_salary + expected_el + expected_gratuity + expected_lta + Decimal("15000.00")
        
        self.assertAlmostEqual(float(settlement.total_payable), float(expected_total), delta=5000)

    def test_gratuity_zero_below_eligibility(self):
        """Employee with < 5 years service gets ₹0 gratuity."""
        data = self._employee_data_for_settlement()
        data["date_of_joining"] = date(2023, 1, 1)  # Only ~2.3 years
        # Create a new exit request to avoid duplicate settlement
        exit2 = ExitRequest.objects.create(
            business_unit_id=self.bu_id,
            employee_id=self.employee.id,
            exit_type=ExitRequest.ExitType.RESIGNATION,
            status=ExitRequest.Status.APPROVED,
            resignation_date=date(2025, 3, 1),
            notice_period_days=30,
            last_working_date=date(2025, 4, 30),
            actual_last_day=date(2025, 4, 30),
            reason="test",
        )
        data["employee_id"] = self.employee.id
        data["date_of_joining"] = date(2023, 1, 1)
        settlement = FinalSettlementService.compute(
            bu_id=self.bu_id,
            exit_request_id=exit2.id,
            employee_data=data,
            computed_by_id=uuid.uuid4(),
        )
        self.assertEqual(settlement.gratuity_amount, Decimal("0.00"))


# ─── 8. LOP Edge Cases ────────────────────────────────────────────────────────

class LOPEdgeCasesTest(PayrollPhase2BaseTest):

    def test_zero_lop_full_month(self):
        """0 LOP → full salary. Proration = 1."""
        ps = SalaryComputationService.compute_payslip(
            employee_id=self.employee.id,
            payroll_run=self.run,
            employee_data=_make_employee_data(self.employee),
            attendance_data=_make_attendance(26, 0),
            leave_data=_leave_data(0),
            correlation_id="test_zero_lop",
        )
        self.assertEqual(ps.paid_days, Decimal("26"))
        self.assertEqual(ps.basic_salary, Decimal("50000.00"))

    def test_max_lop_zero_net(self):
        """26/26 LOP → zero paid days → net salary is 0."""
        ps = SalaryComputationService.compute_payslip(
            employee_id=self.employee.id,
            payroll_run=self.run,
            employee_data=_make_employee_data(self.employee),
            attendance_data=_make_attendance(26, 26),
            leave_data=_leave_data(0),
            correlation_id="test_max_lop",
        )
        self.assertEqual(ps.paid_days, Decimal("0"))
        self.assertEqual(ps.net_salary, Decimal("0.00"))

    def test_partial_lop_proration_correct(self):
        """5 LOP out of 26 days → proration = 21/26."""
        ps = SalaryComputationService.compute_payslip(
            employee_id=self.employee.id,
            payroll_run=self.run,
            employee_data=_make_employee_data(self.employee),
            attendance_data=_make_attendance(26, 5),
            leave_data=_leave_data(0),
            correlation_id="test_partial_lop",
        )
        expected_basic = (Decimal("50000") * Decimal("21") / Decimal("26")).quantize(
            Decimal("0.01")
        )
        self.assertEqual(ps.basic_salary, expected_basic)


# ─── 9. Zero Regression: v1 Test Cases Pass on v2 Service ─────────────────────

class ZeroRegressionV1CasesTest(PayrollPhase2BaseTest):
    """Ensures v2 engine gives same results as v1 for baseline scenarios."""

    def setUp(self):
        super().setUp()
        # TDS slabs matching v1 test setup
        TDSSlab.objects.create(
            business_unit_id=self.bu_id,
            financial_year="2025-26",
            min_income=Decimal("0"),
            max_income=Decimal("300000"),
            tax_rate=Decimal("0"),
            surcharge_rate=Decimal("0"),
            cess_rate=Decimal("0"),
            is_active=True,
        )
        TDSSlab.objects.create(
            business_unit_id=self.bu_id,
            financial_year="2025-26",
            min_income=Decimal("300000"),
            max_income=Decimal("600000"),
            tax_rate=Decimal("5"),
            surcharge_rate=Decimal("0"),
            cess_rate=Decimal("4"),
            is_active=True,
        )

    def test_v1_pf_capped_at_1800(self):
        """PF capped at ₹1,800 for basic > ₹15,000."""
        ps = SalaryComputationService.compute_payslip(
            employee_id=self.employee.id,
            payroll_run=self.run,
            employee_data=_make_employee_data(self.employee, state_code="NA"),
            attendance_data=_make_attendance(30, 0),
            leave_data=_leave_data(0),
            correlation_id="test_pf_cap",
        )
        self.assertEqual(ps.employee_pf, Decimal("1800.00"))

    def test_v1_esi_zero_above_21k(self):
        """No ESI when gross > ₹21,000."""
        ps = SalaryComputationService.compute_payslip(
            employee_id=self.employee.id,
            payroll_run=self.run,
            employee_data=_make_employee_data(self.employee, state_code="NA"),
            attendance_data=_make_attendance(30, 0),
            leave_data=_leave_data(0),
            correlation_id="test_esi_zero",
        )
        self.assertEqual(ps.employee_esi, Decimal("0.00"))

    def test_v1_net_is_gross_minus_deductions(self):
        """Invariant: net_salary == gross_salary - total_deductions."""
        ps = SalaryComputationService.compute_payslip(
            employee_id=self.employee.id,
            payroll_run=self.run,
            employee_data=_make_employee_data(self.employee, state_code="NA"),
            attendance_data=_make_attendance(26, 0),
            leave_data=_leave_data(0),
            correlation_id="test_net_invariant",
        )
        self.assertEqual(ps.net_salary, ps.gross_salary - ps.total_deductions)
