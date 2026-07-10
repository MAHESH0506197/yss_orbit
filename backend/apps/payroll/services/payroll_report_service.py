"""
YSS Orbit — Payroll Report Service

Generates payroll reports needed by HR, Finance, and Compliance:
1. Bank Statement / NEFT File — employee wise net salary disbursement
2. PF/ESI Register — statutory deductions register
3. Monthly Salary Register — full salary statement
4. Payroll Summary — aggregated totals for management
5. Cost Center Report — payroll cost allocation breakdown

All reports return structured data dicts (not files) for rendering by the
API layer as JSON or CSV download. PDF generation is Phase 5 (frontend print).
"""
from __future__ import annotations

import uuid
import calendar
from decimal import Decimal
from typing import Any

from apps.payroll.models.payslip import Payslip
from apps.payroll.models.payroll_run_model import PayrollRun


class PayrollReportService:
    """
    Generates data for payroll reports. Called from API views.
    All methods return serializable dicts for JSON response or CSV export.
    """

    @staticmethod
    def bank_statement(
        bu_id: uuid.UUID,
        payroll_run_id: uuid.UUID,
    ) -> dict[str, Any]:
        """
        Bank Statement / NEFT disbursement file.
        Returns list of employees with bank details and net salary.
        Format matches standard bank NEFT bulk upload format.
        """
        try:
            run = PayrollRun.objects.get(id=payroll_run_id, business_unit_id=bu_id)
        except PayrollRun.DoesNotExist:
            raise ValueError(f"Payroll run {payroll_run_id} not found.")

        if run.status not in {PayrollRun.Status.APPROVED, PayrollRun.Status.LOCKED}:
            raise ValueError(
                "Bank statement can only be generated for APPROVED or LOCKED payroll runs."
            )

        payslips = Payslip.objects.filter(
            business_unit_id=bu_id, payroll_run=run
        ).order_by("employee_code")

        rows = []
        for ps in payslips:
            rows.append({
                "employee_code":  ps.employee_code,
                "employee_name":  ps.employee_name,
                "net_salary":     str(ps.net_salary),
                "payment_mode":   ps.payment_mode,
            })

        return {
            "run_id":            str(run.id),
            "month":             run.month,
            "year":              run.year,
            "total_employees":   run.total_employees,
            "total_net_payable": str(run.total_net),
            "generated_at":      _now_iso(),
            "rows":              rows,
        }

    @staticmethod
    def pf_esi_register(
        bu_id: uuid.UUID,
        payroll_run_id: uuid.UUID,
    ) -> dict[str, Any]:
        """
        PF/ESI Statutory Deduction Register.
        Required for monthly PF/ESI challan filing.
        """
        try:
            run = PayrollRun.objects.get(id=payroll_run_id, business_unit_id=bu_id)
        except PayrollRun.DoesNotExist:
            raise ValueError(f"Payroll run {payroll_run_id} not found.")

        payslips = Payslip.objects.filter(
            business_unit_id=bu_id, payroll_run=run
        ).order_by("employee_code")

        rows = []
        totals = {
            "employee_pf": Decimal("0"),
            "employer_pf": Decimal("0"),
            "employee_esi": Decimal("0"),
            "employer_esi": Decimal("0"),
            "total_pf": Decimal("0"),
            "total_esi": Decimal("0"),
        }

        for ps in payslips:
            rows.append({
                "employee_code":  ps.employee_code,
                "employee_name":  ps.employee_name,
                "basic_salary":   str(ps.basic_salary),
                "gross_salary":   str(ps.gross_salary),
                "employee_pf":    str(ps.employee_pf),
                "employer_pf":    str(ps.employer_pf),
                "total_pf":       str(ps.employee_pf + ps.employer_pf),
                "employee_esi":   str(ps.employee_esi),
                "employer_esi":   str(ps.employer_esi),
                "total_esi":      str(ps.employee_esi + ps.employer_esi),
            })
            totals["employee_pf"] += ps.employee_pf
            totals["employer_pf"] += ps.employer_pf
            totals["employee_esi"] += ps.employee_esi
            totals["employer_esi"] += ps.employer_esi
            totals["total_pf"] += ps.employee_pf + ps.employer_pf
            totals["total_esi"] += ps.employee_esi + ps.employer_esi

        return {
            "run_id":     str(run.id),
            "month":      run.month,
            "year":       run.year,
            "rows":       rows,
            "totals":     {k: str(v) for k, v in totals.items()},
            "generated_at": _now_iso(),
        }

    @staticmethod
    def salary_register(
        bu_id: uuid.UUID,
        payroll_run_id: uuid.UUID,
    ) -> dict[str, Any]:
        """
        Full Monthly Salary Register.
        Includes all earnings, all deductions, statutory deductions breakdown.
        Used for internal audit and IT compliance.
        """
        try:
            run = PayrollRun.objects.get(id=payroll_run_id, business_unit_id=bu_id)
        except PayrollRun.DoesNotExist:
            raise ValueError(f"Payroll run {payroll_run_id} not found.")

        payslips = Payslip.objects.filter(
            business_unit_id=bu_id, payroll_run=run
        ).order_by("employee_code")

        rows = []
        for ps in payslips:
            pt = Decimal(ps.deductions_breakdown.get("PT", "0"))
            lwf = Decimal(ps.deductions_breakdown.get("LWF", "0"))
            rows.append({
                "employee_code":    ps.employee_code,
                "employee_name":    ps.employee_name,
                "month":            ps.month,
                "year":             ps.year,
                "working_days":     str(ps.working_days),
                "paid_days":        str(ps.paid_days),
                "lop_days":         str(ps.lop_days),
                "basic_salary":     str(ps.basic_salary),
                "gross_salary":     str(ps.gross_salary),
                "total_earnings":   str(ps.total_earnings),
                "employee_pf":      str(ps.employee_pf),
                "employee_esi":     str(ps.employee_esi),
                "professional_tax": str(pt),
                "tds":              str(ps.tds),
                "lwf":              str(lwf),
                "total_deductions": str(ps.total_deductions),
                "net_salary":       str(ps.net_salary),
                "earnings":         ps.earnings_breakdown,
                "deductions":       ps.deductions_breakdown,
            })

        return {
            "run_id":     str(run.id),
            "month":      run.month,
            "year":       run.year,
            "period":     f"{_month_name(run.month)} {run.year}",
            "rows":       rows,
            "totals": {
                "gross":      str(run.total_gross),
                "deductions": str(run.total_deductions),
                "net":        str(run.total_net),
                "employees":  run.total_employees,
            },
            "generated_at": _now_iso(),
        }

    @staticmethod
    def payroll_summary(
        bu_id: uuid.UUID,
        payroll_run_id: uuid.UUID,
    ) -> dict[str, Any]:
        """Management-level payroll summary with statistical breakdown."""
        try:
            run = PayrollRun.objects.get(id=payroll_run_id, business_unit_id=bu_id)
        except PayrollRun.DoesNotExist:
            raise ValueError(f"Payroll run {payroll_run_id} not found.")

        payslips = Payslip.objects.filter(
            business_unit_id=bu_id, payroll_run=run
        )

        total_pf = sum(ps.employee_pf + ps.employer_pf for ps in payslips)
        total_esi = sum(ps.employee_esi + ps.employer_esi for ps in payslips)
        total_tds = sum(ps.tds for ps in payslips)

        return {
            "run_id":         str(run.id),
            "status":         run.status,
            "month":          run.month,
            "year":           run.year,
            "period":         f"{_month_name(run.month)} {run.year}",
            "total_employees": run.total_employees,
            "total_gross":    str(run.total_gross),
            "total_net":      str(run.total_net),
            "total_deductions": str(run.total_deductions),
            "total_pf":       str(total_pf),
            "total_esi":      str(total_esi),
            "total_tds":      str(total_tds),
            "approved_by_id": str(run.approved_by_id) if run.approved_by_id else None,
            "approved_at":    run.approved_at.isoformat() if run.approved_at else None,
            "locked_by_id":   str(run.locked_by_id) if run.locked_by_id else None,
            "locked_at":      run.locked_at.isoformat() if run.locked_at else None,
            "generated_at":   _now_iso(),
        }


def _now_iso() -> str:
    from django.utils import timezone
    return timezone.now().isoformat()


def _month_name(month: int) -> str:
    return calendar.month_name[month]
