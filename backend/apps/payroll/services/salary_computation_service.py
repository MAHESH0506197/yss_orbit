"""
YSS Orbit — Salary Computation Service v2
Enterprise-grade payroll computation engine.

New in Phase 2:
- Professional Tax (PT) — state-wise slab lookup
- Income Tax: Old Regime (with declared deductions) vs New Regime (default)
- Contractor/WorkerType exclusions from PF/ESI/PT
- Variable Pay injection from approved EmployeeVariablePay records
- Loan/Advance EMI deduction hooks (prepared but stubbed for Phase 3 loan model)
- Labour Welfare Fund (LWF) deduction
- Full LOP proration for 28/29/30/31 day months

Rules encoded:
- PF:   12% of Basic, capped at ₹1,800/month (₹15,000 wage ceiling)
- ESI:  0.75% employee / 3.25% employer if gross ≤ ₹21,000
- PT:   State-wise slab from ProfessionalTaxSlab table
- TDS:  Old Regime: 80C/80D applied; New Regime: standard deduction ₹50,000 only
- LWF:  From LabourWelfareFundConfig (employee + employer contribution)
- Contractor: excluded from PF/ESI/PT/LWF by default
"""
from __future__ import annotations

import logging
import uuid
from decimal import ROUND_HALF_UP, Decimal
from typing import Any

from django.utils import timezone

from apps.payroll.models.payslip import Payslip
from apps.payroll.models.payroll_run_model import PayrollRun
from apps.payroll.models.tds_model import TDSSlab
from apps.payroll.models.salary_component_model import SalaryComponent, SalaryStructureComponent
from apps.payroll.models.salary_structure import SalaryStructure
from apps.payroll.models.professional_tax_model import (
    ProfessionalTaxSlab,
    LabourWelfareFundConfig,
)
from apps.payroll.models.tax_declaration_model import EmployeeTaxDeclaration
from apps.payroll.models.variable_pay_model import EmployeeVariablePay

logger = logging.getLogger(__name__)

# ─── Constants ────────────────────────────────────────────────────────────────

_PF_RATE = Decimal("0.12")
_PF_MAX_PENSIONABLE_WAGE = Decimal("15000.00")
_PF_MAX_MONTHLY = Decimal("1800.00")          # 12% × ₹15,000

_ESI_EMPLOYEE_RATE = Decimal("0.0075")         # 0.75%
_ESI_EMPLOYER_RATE = Decimal("0.0325")         # 3.25%
_ESI_GROSS_CAP = Decimal("21000.00")

# Workers exempt from statutory deductions by default
_STATUTORY_EXEMPT_WORKER_TYPES = {
    "CONTRACTOR",
    "CONSULTANT",
}

# Standard deduction for New Regime (FY2024-25+)
_NEW_REGIME_STANDARD_DEDUCTION = Decimal("75000.00")   # ₹75,000 from FY25-26
_OLD_REGIME_STANDARD_DEDUCTION = Decimal("50000.00")   # ₹50,000

# New Regime Tax Slabs (FY2025-26, Budget 2025)
_NEW_REGIME_SLABS = [
    (Decimal("0"),         Decimal("400000"),   Decimal("0")),
    (Decimal("400000"),    Decimal("800000"),   Decimal("5")),
    (Decimal("800000"),    Decimal("1200000"),  Decimal("10")),
    (Decimal("1200000"),   Decimal("1600000"),  Decimal("15")),
    (Decimal("1600000"),   Decimal("2000000"),  Decimal("20")),
    (Decimal("2000000"),   Decimal("2400000"),  Decimal("25")),
    (Decimal("2400000"),   None,                Decimal("30")),
]

# Old Regime Tax Slabs
_OLD_REGIME_SLABS = [
    (Decimal("0"),         Decimal("250000"),   Decimal("0")),
    (Decimal("250000"),    Decimal("500000"),   Decimal("5")),
    (Decimal("500000"),    Decimal("1000000"),  Decimal("20")),
    (Decimal("1000000"),   None,                Decimal("30")),
]

_HEALTH_EDU_CESS_RATE = Decimal("4.00")   # 4% on tax


def _round2(value: Decimal) -> Decimal:
    return value.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)


def _compute_tax_from_slabs(taxable_income: Decimal, slabs: list) -> Decimal:
    """Generic slab-based tax calculator (no cess). Returns annual tax before cess."""
    tax = Decimal("0")
    for (lower, upper, rate) in slabs:
        if taxable_income <= lower:
            break
        ceiling = upper if upper is not None else taxable_income
        chunk = min(taxable_income, ceiling) - lower
        if chunk <= 0:
            continue
        tax += chunk * (rate / Decimal("100"))
    return tax


class SalaryComputationService:
    """
    Computes a single employee payslip within a PayrollRun.

    Supports:
    - Old / New income tax regime (from EmployeeTaxDeclaration)
    - Professional Tax (state-wise slabs)
    - Contractor worker_type exclusions
    - Variable Pay injection
    - LWF deduction
    - LOP proration for any month length
    """

    @staticmethod
    def _resolve_financial_year(month: int, year: int) -> str:
        if month >= 4:
            return f"{year}-{str(year + 1)[-2:]}"
        return f"{year - 1}-{str(year)[-2:]}"

    @classmethod
    def compute_payslip(
        cls,
        employee_id: uuid.UUID,
        payroll_run: PayrollRun,
        employee_data: dict[str, Any],
        attendance_data: dict[str, Any],
        leave_data: dict[str, Any],
        correlation_id: str,
    ) -> Payslip:
        """
        Full enterprise payslip computation. Called per-employee from PayrollService.

        employee_data keys:
            employee_code, employee_name, basic_salary, ctc, salary_structure_id,
            payment_mode, worker_type, state_code (for PT)

        attendance_data keys:
            working_days, present_days, lop_days

        leave_data keys:
            lop_days
        """
        business_unit_id: uuid.UUID = payroll_run.business_unit_id
        month: int = payroll_run.month
        year: int = payroll_run.year
        financial_year = cls._resolve_financial_year(month, year)
        worker_type: str = employee_data.get("worker_type", "EMPLOYEE")
        state_code: str = employee_data.get("state_code", "NA")
        is_statutory_exempt: bool = worker_type in _STATUTORY_EXEMPT_WORKER_TYPES

        logger.info("Computing payslip", extra={
            "employee_id": str(employee_id),
            "payroll_run_id": str(payroll_run.id),
            "month": month, "year": year,
            "worker_type": worker_type,
            "correlation_id": correlation_id,
        })

        # ── Step 1: Attendance & LOP ──────────────────────────────────────────
        working_days = Decimal(str(attendance_data.get("working_days", 26)))
        present_days = Decimal(str(attendance_data.get("present_days", working_days)))
        lop_days = max(
            Decimal(str(leave_data.get("lop_days", 0))),
            Decimal(str(attendance_data.get("lop_days", 0)))
        )
        paid_days = max(Decimal("0"), working_days - lop_days)
        proration = (paid_days / working_days) if working_days > 0 else Decimal("1")

        # ── Step 2: Load Salary Structure ─────────────────────────────────────
        structure_id_raw = employee_data.get("salary_structure_id")
        salary_structure = None
        structure_components: list[SalaryStructureComponent] = []

        if structure_id_raw:
            try:
                salary_structure = SalaryStructure.objects.get(
                    id=uuid.UUID(str(structure_id_raw)),
                    business_unit_id=business_unit_id,
                )
                structure_components = list(
                    salary_structure.components.select_related("component")
                )
            except SalaryStructure.DoesNotExist:
                logger.warning("Salary structure not found; basic-only fallback",
                               extra={"structure_id": str(structure_id_raw),
                                      "employee_id": str(employee_id)})

        # ── Step 3: Base Salary Figures ───────────────────────────────────────
        declared_basic = Decimal(str(employee_data.get("basic_salary", 0)))
        declared_ctc   = Decimal(str(employee_data.get("ctc", 0)))
        monthly_ctc    = _round2(declared_ctc / Decimal("12")) if declared_ctc else Decimal("0")
        prorated_basic = _round2(declared_basic * proration)

        # ── Step 4: Earnings ──────────────────────────────────────────────────
        earnings_breakdown: dict[str, str] = {}
        gross_salary = Decimal("0")

        if structure_components:
            for sc in structure_components:
                comp: SalaryComponent = sc.component
                if comp.component_type != "EARNING":
                    continue
                amount = _round2(cls._compute_component_amount(
                    component=comp, basic=prorated_basic, gross=gross_salary,
                    ctc=monthly_ctc, paid_days=paid_days,
                    working_days=working_days, proration=proration,
                ))
                earnings_breakdown[comp.code] = str(amount)
                gross_salary += amount
        else:
            earnings_breakdown["BASIC"] = str(prorated_basic)
            gross_salary = prorated_basic

        gross_salary = _round2(gross_salary)
        total_earnings = gross_salary

        # ── Step 5: Variable Pay Injection ────────────────────────────────────
        variable_pay_amount = Decimal("0")
        variable_pay_injections = []
        if not is_statutory_exempt:
            payment_month_start = timezone.datetime(year, month, 1).date()
            vp_records = EmployeeVariablePay.objects.filter(
                business_unit_id=business_unit_id,
                employee_id=employee_id,
                status=EmployeeVariablePay.Status.APPROVED,
                payment_month__year=year,
                payment_month__month=month,
            )
            for vp in vp_records:
                variable_pay_amount += vp.approved_amount
                variable_pay_injections.append({
                    "id": str(vp.id),
                    "plan": vp.plan.name,
                    "period": vp.period_label,
                    "amount": str(vp.approved_amount),
                })

        if variable_pay_amount > 0:
            earnings_breakdown["VARIABLE_PAY"] = str(_round2(variable_pay_amount))
            gross_salary = _round2(gross_salary + variable_pay_amount)
            total_earnings = _round2(total_earnings + variable_pay_amount)

        # ── Step 6: Statutory Deductions (PF / ESI) ───────────────────────────
        # Contractors and Consultants are excluded from statutory deductions
        if is_statutory_exempt:
            employee_pf = Decimal("0")
            employer_pf = Decimal("0")
            employee_esi = Decimal("0")
            employer_esi = Decimal("0")
        else:
            employee_pf = _round2(min(_PF_RATE * prorated_basic, _PF_MAX_MONTHLY))
            employer_pf = _round2(min(_PF_RATE * prorated_basic, _PF_MAX_MONTHLY))
            if gross_salary <= _ESI_GROSS_CAP:
                employee_esi = _round2(_ESI_EMPLOYEE_RATE * gross_salary)
                employer_esi = _round2(_ESI_EMPLOYER_RATE * gross_salary)
            else:
                employee_esi = Decimal("0")
                employer_esi = Decimal("0")

        # ── Step 7: Professional Tax (PT) ─────────────────────────────────────
        professional_tax = Decimal("0")
        if not is_statutory_exempt and state_code and state_code != "NA":
            professional_tax = cls._compute_professional_tax(
                business_unit_id=business_unit_id,
                financial_year=financial_year,
                state_code=state_code,
                monthly_gross=gross_salary,
            )

        # ── Step 8: TDS Computation ────────────────────────────────────────────
        tds = cls._compute_monthly_tds_v2(
            employee_id=employee_id,
            business_unit_id=business_unit_id,
            monthly_gross=gross_salary,
            employee_pf_annual=employee_pf * 12,
            month=month,
            year=year,
            financial_year=financial_year,
            is_statutory_exempt=is_statutory_exempt,
        )

        # ── Step 9: Labour Welfare Fund (LWF) ─────────────────────────────────
        employee_lwf = Decimal("0")
        employer_lwf = Decimal("0")
        if not is_statutory_exempt:
            employee_lwf, employer_lwf = cls._compute_lwf(
                business_unit_id=business_unit_id,
                state_code=state_code,
                month=month,
            )

        # ── Step 10: Structure-based additional deductions ─────────────────────
        deductions_breakdown: dict[str, str] = {}
        struct_deductions_total = Decimal("0")

        if employee_pf > 0:
            deductions_breakdown["PF_EMP"] = str(employee_pf)
        if employee_esi > 0:
            deductions_breakdown["ESI_EMP"] = str(employee_esi)
        if tds > 0:
            deductions_breakdown["TDS"] = str(tds)
        if professional_tax > 0:
            deductions_breakdown["PT"] = str(professional_tax)
        if employee_lwf > 0:
            deductions_breakdown["LWF"] = str(employee_lwf)

        if structure_components:
            reserved = {"PF_EMP", "ESI_EMP", "TDS", "PT", "LWF", "PF_EMP_EMPLOYER", "ESI_EMPLOYER"}
            for sc in structure_components:
                comp = sc.component
                if comp.component_type == "EARNING":
                    continue
                if comp.code in reserved:
                    continue
                amount = _round2(cls._compute_component_amount(
                    component=comp, basic=prorated_basic, gross=gross_salary,
                    ctc=monthly_ctc, paid_days=paid_days,
                    working_days=working_days, proration=proration,
                ))
                deductions_breakdown[comp.code] = str(amount)
                struct_deductions_total += amount

        total_deductions = _round2(
            employee_pf + employee_esi + tds + professional_tax + employee_lwf + struct_deductions_total
        )
        net_salary = _round2(max(Decimal("0"), gross_salary - total_deductions))

        # ── Step 11: Persist Payslip ───────────────────────────────────────────
        payslip = Payslip(
            business_unit_id=business_unit_id,
            payroll_run=payroll_run,
            employee_id=employee_id,
            employee_code=employee_data.get("employee_code", ""),
            employee_name=employee_data.get("employee_name", ""),
            month=month,
            year=year,
            salary_structure_id=salary_structure.id if salary_structure else None,
            working_days=working_days,
            paid_days=paid_days,
            lop_days=lop_days,
            basic_salary=prorated_basic,
            gross_salary=gross_salary,
            total_earnings=total_earnings,
            total_deductions=total_deductions,
            net_salary=net_salary,
            employee_pf=employee_pf,
            employer_pf=employer_pf,
            employee_esi=employee_esi,
            employer_esi=employer_esi,
            tds=tds,
            earnings_breakdown=earnings_breakdown,
            deductions_breakdown=deductions_breakdown,
            status=Payslip.Status.GENERATED,
            payment_mode=employee_data.get("payment_mode", Payslip.PaymentMode.BANK_TRANSFER),
        )
        payslip.save()

        # Mark variable pay records as PAID
        if variable_pay_injections:
            EmployeeVariablePay.objects.filter(
                business_unit_id=business_unit_id,
                employee_id=employee_id,
                status=EmployeeVariablePay.Status.APPROVED,
                payment_month__year=year,
                payment_month__month=month,
            ).update(status=EmployeeVariablePay.Status.PAID, paid_payslip_id=payslip.id)

        return payslip

    # ── Internal Computation Helpers ──────────────────────────────────────────

    @classmethod
    def _compute_component_amount(
        cls,
        component: SalaryComponent,
        basic: Decimal, gross: Decimal, ctc: Decimal,
        paid_days: Decimal, working_days: Decimal, proration: Decimal,
    ) -> Decimal:
        calc_type = component.calculation_type
        value = component.value

        if calc_type == "FIXED":
            return value * proration
        elif calc_type == "PERCENTAGE_OF_BASIC":
            return (value / Decimal("100")) * basic
        elif calc_type == "PERCENTAGE_OF_CTC":
            return (value / Decimal("100")) * ctc
        elif calc_type == "PERCENTAGE_OF_GROSS":
            return (value / Decimal("100")) * gross
        elif calc_type == "CUSTOM_FORMULA":
            return Decimal("0")  # Phase 3: formula engine
        return Decimal("0")

    @classmethod
    def _compute_professional_tax(
        cls,
        business_unit_id: uuid.UUID,
        financial_year: str,
        state_code: str,
        monthly_gross: Decimal,
    ) -> Decimal:
        """
        Look up monthly PT amount from ProfessionalTaxSlab.
        Returns 0 if no slab configured for state / FY.
        """
        slabs = ProfessionalTaxSlab.objects.filter(
            business_unit_id=business_unit_id,
            state_code=state_code,
            financial_year=financial_year,
            is_active=True,
        ).order_by("salary_from")

        for slab in slabs:
            upper = slab.salary_to
            if upper is None:  # topmost slab (no ceiling)
                if monthly_gross >= slab.salary_from:
                    return _round2(slab.monthly_pt_amount)
            elif slab.salary_from <= monthly_gross <= upper:
                return _round2(slab.monthly_pt_amount)

        return Decimal("0")

    @classmethod
    def _compute_lwf(
        cls,
        business_unit_id: uuid.UUID,
        state_code: str,
        month: int,
    ) -> tuple[Decimal, Decimal]:
        """
        Returns (employee_lwf, employer_lwf) for the given month.
        For BIANNUAL frequency: deducted in June and December only.
        For ANNUAL frequency: deducted in March only.
        """
        try:
            config = LabourWelfareFundConfig.objects.get(
                business_unit_id=business_unit_id,
                state_code=state_code,
                is_active=True,
            )
        except LabourWelfareFundConfig.DoesNotExist:
            return Decimal("0"), Decimal("0")

        if config.frequency == "MONTHLY":
            return _round2(config.employee_contribution), _round2(config.employer_contribution)
        elif config.frequency == "BIANNUAL" and month in (6, 12):
            return _round2(config.employee_contribution), _round2(config.employer_contribution)
        elif config.frequency == "ANNUAL" and month == 3:
            return _round2(config.employee_contribution), _round2(config.employer_contribution)

        return Decimal("0"), Decimal("0")

    @classmethod
    def _compute_monthly_tds_v2(
        cls,
        employee_id: uuid.UUID,
        business_unit_id: uuid.UUID,
        monthly_gross: Decimal,
        employee_pf_annual: Decimal,
        month: int,
        year: int,
        financial_year: str,
        is_statutory_exempt: bool,
    ) -> Decimal:
        """
        Computes monthly TDS using Old or New tax regime.

        Priority:
        1. If employee has a LOCKED/VERIFIED EmployeeTaxDeclaration for the FY → use it
        2. Else → default to New Regime with standard deduction only

        Old Regime:
          - Taxable = Annual Gross - Standard Deduction (₹50K) - 80C - 80D - HRA - ...
          - Employee PF (12%) is auto-deducted via 80C (up to ₹1.5L combined cap)

        New Regime:
          - Taxable = Annual Gross - Standard Deduction (₹75K from FY25-26)
          - No other deductions allowed
          - Rebate u/s 87A: tax = 0 if income ≤ ₹12L (FY25-26)
        """
        if is_statutory_exempt:
            # Contractors use simple new regime, no 80C
            return cls._new_regime_tds(monthly_gross)

        # Try to load active declaration
        annual_gross = monthly_gross * Decimal("12")
        declaration = None
        try:
            declaration = EmployeeTaxDeclaration.objects.get(
                business_unit_id=business_unit_id,
                employee_id=employee_id,
                financial_year=financial_year,
                status__in=[
                    EmployeeTaxDeclaration.Status.VERIFIED,
                    EmployeeTaxDeclaration.Status.LOCKED,
                ],
            )
        except EmployeeTaxDeclaration.DoesNotExist:
            pass

        if declaration and declaration.tax_regime == EmployeeTaxDeclaration.TaxRegime.OLD_REGIME:
            return cls._old_regime_tds(annual_gross, declaration, employee_pf_annual)
        else:
            return cls._new_regime_tds(monthly_gross)

    @staticmethod
    def _new_regime_tds(monthly_gross: Decimal) -> Decimal:
        """New Regime TDS — standard deduction ₹75K, rebate ≤ ₹12L."""
        annual_gross = monthly_gross * Decimal("12")
        taxable = max(Decimal("0"), annual_gross - _NEW_REGIME_STANDARD_DEDUCTION)

        # Rebate u/s 87A: if taxable income ≤ ₹12,00,000, tax = 0
        if taxable <= Decimal("1200000"):
            return Decimal("0")

        raw_tax = _compute_tax_from_slabs(taxable, [
            (lower, upper, rate) for lower, upper, rate in _NEW_REGIME_SLABS
        ])
        cess = raw_tax * (_HEALTH_EDU_CESS_RATE / Decimal("100"))
        annual_tax = _round2(raw_tax + cess)
        return _round2(annual_tax / Decimal("12"))

    @staticmethod
    def _old_regime_tds(
        annual_gross: Decimal,
        declaration: "EmployeeTaxDeclaration",
        employee_pf_annual: Decimal,
    ) -> Decimal:
        """Old Regime TDS with Chapter VI-A deductions and exemptions."""
        # 80C cap: ₹1,50,000 (includes employee PF)
        _80C_CAP = Decimal("150000")
        section_80c_total = min(
            declaration.section_80c + employee_pf_annual,
            _80C_CAP
        )

        deductions = (
            _OLD_REGIME_STANDARD_DEDUCTION
            + section_80c_total
            + declaration.section_80d
            + declaration.section_80e
            + declaration.section_80g
            + declaration.section_80tta
            + declaration.hra_exemption
            + declaration.lta_exemption
            + declaration.other_exemptions
        )

        taxable = max(Decimal("0"), annual_gross - deductions)

        # Rebate u/s 87A: if taxable ≤ ₹5L, tax = 0
        if taxable <= Decimal("500000"):
            return Decimal("0")

        raw_tax = _compute_tax_from_slabs(taxable, [
            (lower, upper, rate) for lower, upper, rate in _OLD_REGIME_SLABS
        ])
        cess = raw_tax * (_HEALTH_EDU_CESS_RATE / Decimal("100"))
        annual_tax = _round2(raw_tax + cess)
        return _round2(annual_tax / Decimal("12"))

    @staticmethod
    def _resolve_financial_year(month: int, year: int) -> str:
        if month >= 4:
            return f"{year}-{str(year + 1)[-2:]}"
        return f"{year - 1}-{str(year)[-2:]}"
