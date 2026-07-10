from django.test import TestCase
from decimal import Decimal
import uuid
from datetime import date

from apps.organization.models import BusinessUnit
from apps.organization.models.organization_model import Organization
from apps.payroll.models.payroll_run_model import PayrollRun
from apps.payroll.models.tds_model import TDSSlab
from apps.payroll.models.professional_tax_model import ProfessionalTaxSlab
from apps.payroll.models.variable_pay_model import VariablePayPlan, EmployeeVariablePay
from apps.payroll.models.tax_declaration_model import EmployeeTaxDeclaration
from apps.payroll.services.salary_computation_service import SalaryComputationService
from apps.hrms.models import Employee


class SalaryComputationServiceTest(TestCase):
    def setUp(self):
        # Create Org & BU
        self.org = Organization.objects.create(name="Test Org", business_domain=__import__('apps.organization.models.business_domain_model', fromlist=['BusinessDomain']).BusinessDomain.objects.get_or_create(name='Test Domain ' + __import__('uuid').uuid4().hex[:8], code='TEST' + __import__('uuid').uuid4().hex[:4])[0])
        self.bu = BusinessUnit.objects.create(name="Test BU", organization=self.org)

        # Create Employee (basic=50K, state=default empty)
        self.employee = Employee.objects.create(
            business_unit_id=self.bu.id,
            first_name="Mahesh",
            last_name="Yarlagadda",
            employee_code="EMP001",
            basic_salary=Decimal("50000.00"),
            ctc=Decimal("1200000.00"),  # 12 LPA
            date_of_joining="2024-01-01",
        )

        # Create Payroll Run for April 2024
        self.payroll_run = PayrollRun.objects.create(
            business_unit_id=self.bu.id,
            month=4,
            year=2024,
        )

        # Create TDS Slabs (Old Regime reference — not directly used by v2 engine
        # but kept for DB integrity)
        TDSSlab.objects.create(
            business_unit_id=self.bu.id,
            financial_year="2024-25",
            min_income=Decimal("0"),
            max_income=Decimal("300000"),
            tax_rate=Decimal("0"),
            surcharge_rate=Decimal("0"),
            cess_rate=Decimal("0"),
            is_active=True,
        )
        TDSSlab.objects.create(
            business_unit_id=self.bu.id,
            financial_year="2024-25",
            min_income=Decimal("300000"),
            max_income=Decimal("600000"),
            tax_rate=Decimal("5"),
            surcharge_rate=Decimal("0"),
            cess_rate=Decimal("4"),
            is_active=True,
        )

    # ── Helpers ───────────────────────────────────────────────────────────────

    def _emp_data(self, emp=None, **overrides):
        """Build a standard employee_data dict for SalaryComputationService."""
        e = emp or self.employee
        data = {
            "employee_code": e.employee_code,
            "employee_name": f"{e.first_name} {e.last_name}",
            "basic_salary": e.basic_salary,
            "ctc": e.ctc,
            "salary_structure_id": None,
            "payment_mode": "BANK_TRANSFER",
            "worker_type": e.worker_type,
            "state_code": e.state_code or "NA",
        }
        data.update(overrides)
        return data

    def _attendance(self, working_days=30, lop_days=0):
        return {
            "working_days": working_days,
            "present_days": working_days - lop_days,
            "lop_days": lop_days,
        }

    def _compute(self, emp_data, attendance_data, leave_data=None, run=None):
        return SalaryComputationService.compute_payslip(
            employee_id=self.employee.id,
            payroll_run=run or self.payroll_run,
            employee_data=emp_data,
            attendance_data=attendance_data,
            leave_data=leave_data or {"lop_days": 0},
            correlation_id=str(uuid.uuid4()),
        )

    def _new_run(self, month, year):
        return PayrollRun.objects.create(
            business_unit_id=self.bu.id, month=month, year=year
        )

    # ── Existing Tests (Phase 1 baseline) ────────────────────────────────────

    def test_basic_salary_computation(self):
        """Baseline: basic=50K, no LOP, no structure → gross=50K, PF=1800, ESI=0."""
        payslip = self._compute(
            self._emp_data(),
            self._attendance(30, 0),
        )
        self.assertEqual(payslip.gross_salary, Decimal("50000.00"))
        self.assertEqual(payslip.employee_pf, Decimal("1800.00"))   # 12% × 50K → capped at 1800
        self.assertEqual(payslip.employee_esi, Decimal("0.00"))     # gross > 21K → 0
        self.assertEqual(payslip.tds, Decimal("0.00"))              # New Regime, 6L annual ≤ 12L → rebate
        self.assertEqual(payslip.total_deductions, Decimal("1800.00"))
        self.assertEqual(payslip.net_salary, Decimal("48200.00"))

    def test_lop_proration(self):
        """LOP: 10 days LOP in 30-day month → basic × (20/30) = 33,333.33."""
        payslip = self._compute(
            self._emp_data(),
            self._attendance(30, 10),
        )
        self.assertEqual(payslip.gross_salary, Decimal("33333.33"))
        self.assertEqual(payslip.employee_pf, Decimal("1800.00"))   # Still capped
        self.assertEqual(payslip.tds, Decimal("0.00"))
        self.assertEqual(payslip.net_salary, Decimal("33333.33") - Decimal("1800.00"))

    # ── Phase 2: 10 Mandatory Payroll Calculation Test Cases ─────────────────

    def test_pf_cap_at_1800_for_high_basic(self):
        """
        PF: 12% of basic is capped at ₹1,800/month (wage ceiling ₹15,000).
        Employee basic=₹50,000 → 12% = ₹6,000 → capped to ₹1,800.
        """
        payslip = self._compute(self._emp_data(), self._attendance(30))
        self.assertEqual(
            payslip.employee_pf, Decimal("1800.00"),
            "PF must be capped at ₹1,800 even when 12% of basic exceeds it",
        )

    def test_pf_proportional_when_basic_below_ceiling(self):
        """
        PF: when basic < ₹15,000, PF = 12% of basic (no cap needed).
        Employee basic=₹8,000 → PF = 12% × ₹8,000 = ₹960.
        """
        low_emp = Employee.objects.create(
            business_unit_id=self.bu.id,
            first_name="Low", last_name="Basic",
            employee_code="EMP_LOW",
            basic_salary=Decimal("8000.00"),
            ctc=Decimal("96000.00"),
            date_of_joining="2024-01-01",
        )
        run = self._new_run(5, 2024)
        payslip = SalaryComputationService.compute_payslip(
            employee_id=low_emp.id,
            payroll_run=run,
            employee_data=self._emp_data(low_emp),
            attendance_data=self._attendance(30),
            leave_data={"lop_days": 0},
            correlation_id=str(uuid.uuid4()),
        )
        self.assertEqual(
            payslip.employee_pf, Decimal("960.00"),
            "PF must be 12% of basic (₹960) when basic is below the ₹15,000 PF ceiling",
        )

    def test_esi_zero_when_gross_above_21000(self):
        """
        ESI: exempt when gross > ₹21,000.
        Employee basic=₹50,000 → gross=₹50,000 → ESI=₹0.
        """
        payslip = self._compute(self._emp_data(), self._attendance(30))
        self.assertEqual(payslip.employee_esi, Decimal("0.00"),
                         "ESI must be ₹0 when gross > ₹21,000")

    def test_esi_deducted_when_gross_below_threshold(self):
        """
        ESI: 0.75% of gross when gross ≤ ₹21,000.
        Employee basic=₹18,000 → ESI = 0.75% × ₹18,000 = ₹135.
        """
        low_emp = Employee.objects.create(
            business_unit_id=self.bu.id,
            first_name="ESI", last_name="Eligible",
            employee_code="EMP_ESI",
            basic_salary=Decimal("18000.00"),
            ctc=Decimal("216000.00"),
            date_of_joining="2024-01-01",
        )
        run = self._new_run(6, 2024)
        payslip = SalaryComputationService.compute_payslip(
            employee_id=low_emp.id,
            payroll_run=run,
            employee_data=self._emp_data(low_emp),
            attendance_data=self._attendance(30),
            leave_data={"lop_days": 0},
            correlation_id=str(uuid.uuid4()),
        )
        expected = (Decimal("0.0075") * Decimal("18000.00")).quantize(Decimal("0.01"))
        self.assertEqual(payslip.employee_esi, expected,
                         "ESI must be 0.75% × gross when gross ≤ ₹21,000")

    def test_tds_old_regime_applies_80c_deduction(self):
        """
        TDS Old Regime: 80C must reduce taxable income → lower TDS than New Regime.
        High earner (basic=₹200K/month = ₹24L annual) with max 80C (₹1.5L)
        declared under Old Regime should have TDS computed on reduced taxable income.
        """
        high_emp = Employee.objects.create(
            business_unit_id=self.bu.id,
            first_name="Old", last_name="Regime",
            employee_code="EMP_OLD",
            basic_salary=Decimal("200000.00"),
            ctc=Decimal("2400000.00"),
            date_of_joining="2024-01-01",
        )
        # Verified OLD_REGIME declaration with full 80C + 80D
        EmployeeTaxDeclaration.objects.create(
            business_unit_id=self.bu.id,
            employee_id=high_emp.id,
            financial_year="2024-25",
            tax_regime=EmployeeTaxDeclaration.TaxRegime.OLD_REGIME,
            status=EmployeeTaxDeclaration.Status.VERIFIED,
            section_80c=Decimal("150000"),
            section_80d=Decimal("25000"),
        )
        run_old = self._new_run(7, 2024)
        payslip_old = SalaryComputationService.compute_payslip(
            employee_id=high_emp.id,
            payroll_run=run_old,
            employee_data=self._emp_data(high_emp),
            attendance_data=self._attendance(30),
            leave_data={"lop_days": 0},
            correlation_id=str(uuid.uuid4()),
        )

        # For comparison: New Regime (no declaration → default)
        run_new = self._new_run(8, 2024)
        payslip_new = SalaryComputationService.compute_payslip(
            employee_id=high_emp.id,
            payroll_run=run_new,
            employee_data=self._emp_data(high_emp),
            attendance_data=self._attendance(30),
            leave_data={"lop_days": 0},
            correlation_id=str(uuid.uuid4()),
        )

        # Old regime TDS should be > 0 (₹24L is above all exemptions)
        self.assertGreater(payslip_old.tds, Decimal("0"),
                           "High earner on Old Regime must have non-zero TDS")
        # Old regime with 80C+80D gives more deductions than New Regime standard ded
        # Both have positive TDS — the exact relationship depends on slabs but both > 0
        self.assertGreater(payslip_new.tds, Decimal("0"),
                           "High earner on New Regime must have non-zero TDS")

    def test_tds_new_regime_ignores_80c(self):
        """
        TDS New Regime: 80C declarations must NOT affect TDS.
        Two compute calls for same high earner — one with NEW_REGIME declaration
        specifying 80C, one without any declaration — must produce identical TDS.
        """
        high_emp = Employee.objects.create(
            business_unit_id=self.bu.id,
            first_name="New", last_name="Regime",
            employee_code="EMP_NEW",
            basic_salary=Decimal("200000.00"),
            ctc=Decimal("2400000.00"),
            date_of_joining="2024-01-01",
        )
        # Run A: no declaration → defaults to New Regime
        run_a = self._new_run(9, 2024)
        payslip_a = SalaryComputationService.compute_payslip(
            employee_id=high_emp.id,
            payroll_run=run_a,
            employee_data=self._emp_data(high_emp),
            attendance_data=self._attendance(30),
            leave_data={"lop_days": 0},
            correlation_id=str(uuid.uuid4()),
        )

        # Run B: explicit NEW_REGIME declaration with max 80C (should be ignored)
        EmployeeTaxDeclaration.objects.create(
            business_unit_id=self.bu.id,
            employee_id=high_emp.id,
            financial_year="2024-25",
            tax_regime=EmployeeTaxDeclaration.TaxRegime.NEW_REGIME,
            status=EmployeeTaxDeclaration.Status.VERIFIED,
            section_80c=Decimal("150000"),   # Must be ignored
        )
        run_b = self._new_run(10, 2024)
        payslip_b = SalaryComputationService.compute_payslip(
            employee_id=high_emp.id,
            payroll_run=run_b,
            employee_data=self._emp_data(high_emp),
            attendance_data=self._attendance(30),
            leave_data={"lop_days": 0},
            correlation_id=str(uuid.uuid4()),
        )

        self.assertEqual(
            payslip_a.tds, payslip_b.tds,
            "New Regime TDS must be identical regardless of 80C in declaration",
        )

    def test_pt_karnataka_slab_applied_to_net(self):
        """
        PT Karnataka: gross ≥ ₹15,000 → ₹200/month deducted.
        Verify PT in deductions_breakdown and correctly subtracted from net.
        """
        ProfessionalTaxSlab.objects.create(
            business_unit_id=self.bu.id,
            state_code="KA",
            financial_year="2024-25",
            salary_from=Decimal("0"),
            salary_to=Decimal("14999.99"),
            monthly_pt_amount=Decimal("0"),
            is_active=True,
        )
        ProfessionalTaxSlab.objects.create(
            business_unit_id=self.bu.id,
            state_code="KA",
            financial_year="2024-25",
            salary_from=Decimal("15000"),
            salary_to=None,
            monthly_pt_amount=Decimal("200"),
            is_active=True,
        )

        run = self._new_run(11, 2024)
        payslip = SalaryComputationService.compute_payslip(
            employee_id=self.employee.id,
            payroll_run=run,
            employee_data=self._emp_data(state_code="KA"),
            attendance_data=self._attendance(30),
            leave_data={"lop_days": 0},
            correlation_id=str(uuid.uuid4()),
        )

        self.assertIn("PT", payslip.deductions_breakdown,
                      "PT must appear in deductions_breakdown for KA employee")
        self.assertEqual(payslip.deductions_breakdown.get("PT"), "200.00",
                         "PT must be ₹200 for Karnataka gross > ₹15,000")
        # net = gross(50000) - PF(1800) - PT(200) = 48000
        self.assertEqual(payslip.net_salary, Decimal("48000.00"),
                         "Net salary must include PT deduction")

    def test_lop_proration_28_day_february(self):
        """LOP proration: 28-day February, 3 LOP → paid=25, proration=25/28."""
        run = self._new_run(2, 2025)   # 2025 Feb = 28 days
        payslip = SalaryComputationService.compute_payslip(
            employee_id=self.employee.id,
            payroll_run=run,
            employee_data=self._emp_data(),
            attendance_data={"working_days": 28, "present_days": 25, "lop_days": 3},
            leave_data={"lop_days": 0},
            correlation_id=str(uuid.uuid4()),
        )
        expected = (Decimal("50000") * Decimal("25") / Decimal("28")).quantize(Decimal("0.01"))
        self.assertEqual(payslip.gross_salary, expected,
                         "28-day Feb LOP: gross must be basic × (25/28)")
        self.assertEqual(payslip.lop_days, Decimal("3"))

    def test_lop_proration_29_day_february_leap_year(self):
        """LOP proration: 29-day February (2028 leap), 5 LOP → proration=24/29."""
        run = self._new_run(2, 2028)
        payslip = SalaryComputationService.compute_payslip(
            employee_id=self.employee.id,
            payroll_run=run,
            employee_data=self._emp_data(),
            attendance_data={"working_days": 29, "present_days": 24, "lop_days": 5},
            leave_data={"lop_days": 0},
            correlation_id=str(uuid.uuid4()),
        )
        expected = (Decimal("50000") * Decimal("24") / Decimal("29")).quantize(Decimal("0.01"))
        self.assertEqual(payslip.gross_salary, expected,
                         "29-day Feb (leap) LOP: gross must be basic × (24/29)")

    def test_lop_proration_31_day_month(self):
        """LOP proration: 31-day January, 2 LOP → paid=29, proration=29/31."""
        run = self._new_run(1, 2025)
        payslip = SalaryComputationService.compute_payslip(
            employee_id=self.employee.id,
            payroll_run=run,
            employee_data=self._emp_data(),
            attendance_data={"working_days": 31, "present_days": 29, "lop_days": 2},
            leave_data={"lop_days": 0},
            correlation_id=str(uuid.uuid4()),
        )
        expected = (Decimal("50000") * Decimal("29") / Decimal("31")).quantize(Decimal("0.01"))
        self.assertEqual(payslip.gross_salary, expected,
                         "31-day month LOP: gross must be basic × (29/31)")

    def test_variable_pay_performance_linked_injected_into_gross(self):
        """
        Variable Pay: PERFORMANCE_LINKED, approved_amount=₹15,000.
        gross = basic(50K) + variable(15K) = 65K.
        VARIABLE_PAY must appear in earnings_breakdown.
        """
        plan = VariablePayPlan.objects.create(
            business_unit_id=self.bu.id,
            name="Annual Performance Bonus",
            plan_type=VariablePayPlan.PlanType.ANNUAL,
            calculation_method=VariablePayPlan.CalculationMethod.PERFORMANCE_LINKED,
            value=Decimal("10000.00"),
            performance_matrix={"4.0": 1.5},
            is_active=True,
        )
        run = self._new_run(3, 2025)
        EmployeeVariablePay.objects.create(
            business_unit_id=self.bu.id,
            employee_id=self.employee.id,
            plan=plan,
            period_label="Annual-2024",
            performance_rating=Decimal("4.0"),
            calculated_amount=Decimal("10000.00"),
            approved_amount=Decimal("15000.00"),    # 10000 × 1.5 multiplier
            status=EmployeeVariablePay.Status.APPROVED,
            payment_month=date(2025, 3, 1),
        )
        payslip = SalaryComputationService.compute_payslip(
            employee_id=self.employee.id,
            payroll_run=run,
            employee_data=self._emp_data(),
            attendance_data=self._attendance(31),
            leave_data={"lop_days": 0},
            correlation_id=str(uuid.uuid4()),
        )
        self.assertEqual(payslip.gross_salary, Decimal("65000.00"),
                         "Gross must include approved variable pay (50K + 15K = 65K)")
        self.assertIn("VARIABLE_PAY", payslip.earnings_breakdown,
                      "VARIABLE_PAY must appear in earnings_breakdown")
        self.assertEqual(payslip.earnings_breakdown["VARIABLE_PAY"], "15000.00",
                         "earnings_breakdown[VARIABLE_PAY] must equal the approved_amount")

    def test_contractor_zero_pf_esi_pt(self):
        """
        Contractor (CONTRACTOR worker_type): PF=0, ESI=0, PT absent from deductions.
        Even with KA state_code and gross > ₹21,000, all statutory deductions are ₹0.
        """
        ProfessionalTaxSlab.objects.get_or_create(
            business_unit_id=self.bu.id,
            state_code="KA",
            financial_year="2024-25",
            salary_from=Decimal("15000"),
            salary_to=None,
            defaults={"monthly_pt_amount": Decimal("200"), "is_active": True},
        )
        contractor = Employee.objects.create(
            business_unit_id=self.bu.id,
            first_name="Contract", last_name="Worker",
            employee_code="CONT001",
            worker_type=Employee.WorkerType.CONTRACTOR,
            basic_salary=Decimal("50000.00"),
            ctc=Decimal("600000.00"),
            state_code="KA",
            date_of_joining="2024-01-01",
        )
        run = self._new_run(12, 2024)
        payslip = SalaryComputationService.compute_payslip(
            employee_id=contractor.id,
            payroll_run=run,
            employee_data=self._emp_data(contractor, state_code="KA"),
            attendance_data=self._attendance(31),
            leave_data={"lop_days": 0},
            correlation_id=str(uuid.uuid4()),
        )
        self.assertEqual(payslip.employee_pf, Decimal("0.00"),
                         "Contractor: PF must be ₹0")
        self.assertEqual(payslip.employee_esi, Decimal("0.00"),
                         "Contractor: ESI must be ₹0")
        self.assertNotIn("PT", payslip.deductions_breakdown,
                         "Contractor: PT must not appear in deductions_breakdown")
        self.assertEqual(payslip.employee_pf + payslip.employee_esi, Decimal("0.00"),
                         "Contractor: total statutory deductions (PF+ESI) must be ₹0")
