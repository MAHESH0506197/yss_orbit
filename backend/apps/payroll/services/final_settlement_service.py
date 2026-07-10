"""
YSS Orbit — Final Settlement Service

Computes the complete final settlement for an exiting employee.

Components computed:
1. Salary for last month (pro-rated for actual days worked)
2. Earned Leave Encashment (pending EL balance × daily basic)
3. Gratuity (Basic × 15 × Years) / 26 — if service ≥ eligibility threshold
4. Statutory Bonus arrears (if applicable)
5. LTA balance payout

Recoveries:
1. Notice period shortfall recovery (unserved days × daily gross)
2. Outstanding loan/advance EMI balance
3. Asset recovery (if assets not returned)

Net: payables − recoveries
TDS on gratuity above ₹20L, TDS on leave encashment for govt employees.

Called from ExitRequest approval workflow.
"""
from __future__ import annotations

import uuid
import logging
from decimal import Decimal, ROUND_HALF_UP
from datetime import date

from django.db import transaction
from django.utils import timezone

from apps.hrms.models.lifecycle import ExitRequest, FinalSettlement
from apps.payroll.models.professional_tax_model import GratuityConfig

logger = logging.getLogger(__name__)


def _round2(value: Decimal) -> Decimal:
    return value.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)


class FinalSettlementError(Exception):
    pass


class FinalSettlementService:
    """
    Computes and creates a FinalSettlement record for an employee exit.

    The settlement is a draft until approved by Finance.
    All amounts are computed from passed employee_data — the service
    does not query hrms.Employee directly (DDD boundary compliance).
    """

    @classmethod
    @transaction.atomic
    def compute(
        cls,
        bu_id: uuid.UUID,
        exit_request_id: uuid.UUID,
        employee_data: dict,
        computed_by_id: uuid.UUID,
    ) -> FinalSettlement:
        """
        Compute and persist a FinalSettlement.

        employee_data keys:
            employee_id (UUID)
            basic_salary (Decimal) — monthly basic
            gross_salary_monthly (Decimal)
            date_of_joining (date)
            actual_last_day (date)
            notice_period_days (int) — contractual notice period
            notice_served_days (int) — actual days served
            earned_leave_balance (Decimal) — pending EL days
            loan_outstanding (Decimal) — outstanding loan balance
            assets_not_returned_value (Decimal)
            state_code (str) — for gratuity/PT config lookup
            lta_balance (Decimal, optional)
            statutory_bonus_arrears (Decimal, optional)
        """
        try:
            exit_request = ExitRequest.objects.select_for_update().get(
                id=exit_request_id,
                business_unit_id=bu_id,
            )
        except ExitRequest.DoesNotExist:
            raise FinalSettlementError(f"Exit request {exit_request_id} not found.")

        if hasattr(exit_request, "settlement"):
            raise FinalSettlementError(
                f"Settlement already exists for exit request {exit_request_id}."
            )

        employee_id = uuid.UUID(str(employee_data["employee_id"]))
        basic_monthly = Decimal(str(employee_data.get("basic_salary", 0)))
        gross_monthly = Decimal(str(employee_data.get("gross_salary_monthly", 0)))
        doj: date = employee_data["date_of_joining"]
        last_day: date = employee_data.get("actual_last_day") or date.today()

        # ── 1. Salary for Last Month (pro-rated) ──────────────────────────────
        last_month_days = cls._days_in_month(last_day.year, last_day.month)
        days_worked = last_day.day  # assuming working from 1st to last_day
        salary_last_month = _round2(
            (gross_monthly / Decimal(str(last_month_days))) * Decimal(str(days_worked))
        )

        # ── 2. Earned Leave Encashment ─────────────────────────────────────────
        el_balance = Decimal(str(employee_data.get("earned_leave_balance", 0)))
        daily_basic = _round2(basic_monthly / Decimal("26"))  # 26-day convention
        earned_leave_encashment = _round2(el_balance * daily_basic)

        # ── 3. Gratuity ────────────────────────────────────────────────────────
        gratuity_amount = Decimal("0")
        tds_on_gratuity = Decimal("0")
        try:
            gratuity_config = GratuityConfig.objects.get(
                business_unit_id=bu_id, is_active=True
            )
            years_of_service = cls._compute_service_years(doj, last_day)
            if years_of_service >= float(gratuity_config.eligibility_years):
                raw_gratuity = _round2(
                    (basic_monthly * gratuity_config.rate_per_year * Decimal(str(years_of_service)))
                    / Decimal(str(gratuity_config.working_days_divisor))
                )
                gratuity_amount = min(raw_gratuity, gratuity_config.max_gratuity_amount)
                # TDS on gratuity: taxable only if > ₹20L (govt employees threshold different)
                _GRATUITY_TAX_FREE = Decimal("2000000")  # ₹20L
                if gratuity_amount > _GRATUITY_TAX_FREE:
                    taxable_gratuity = gratuity_amount - _GRATUITY_TAX_FREE
                    # 30% flat TDS on excess (simplified; exact TDS by regime in Phase 3)
                    tds_on_gratuity = _round2(taxable_gratuity * Decimal("0.30"))
        except GratuityConfig.DoesNotExist:
            logger.warning("No GratuityConfig found for BU %s; gratuity = 0", bu_id)

        # ── 4. LTA Balance & Bonus Arrears ─────────────────────────────────────
        lta_balance = Decimal(str(employee_data.get("lta_balance", 0)))
        bonus_amount = Decimal(str(employee_data.get("statutory_bonus_arrears", 0)))

        # ── 5. Notice Period Shortfall Recovery ────────────────────────────────
        notice_days = int(employee_data.get("notice_period_days", 30))
        served_days = int(employee_data.get("notice_served_days", notice_days))
        shortfall_days = max(0, notice_days - served_days)
        daily_gross = _round2(gross_monthly / Decimal("26"))
        notice_recovery = _round2(Decimal(str(shortfall_days)) * daily_gross)

        # ── 6. Loan/Advance & Asset Recoveries ────────────────────────────────
        advance_recovery = Decimal(str(employee_data.get("loan_outstanding", 0)))
        asset_recovery = Decimal(str(employee_data.get("assets_not_returned_value", 0)))

        # ── 7. Net Settlement ──────────────────────────────────────────────────
        total_payable = _round2(
            salary_last_month + earned_leave_encashment + gratuity_amount + bonus_amount + lta_balance
        )
        total_recovery = _round2(notice_recovery + advance_recovery + asset_recovery)
        net_amount = _round2(total_payable - total_recovery)

        notes = (
            f"Gratuity: {years_of_service:.2f} years × {basic_monthly} basic\n"
            f"EL Encashment: {el_balance} days × {daily_basic}/day\n"
            f"Notice shortfall: {shortfall_days} days × {daily_gross}/day\n"
        ) if el_balance or shortfall_days else ""

        settlement = FinalSettlement.objects.create(
            business_unit_id=bu_id,
            employee_id=employee_id,
            exit_request=exit_request,
            status=FinalSettlement.Status.COMPUTED,
            salary_for_last_month=salary_last_month,
            earned_leave_encashment=earned_leave_encashment,
            gratuity_amount=gratuity_amount,
            bonus_amount=bonus_amount,
            lta_balance=lta_balance,
            other_payables=Decimal("0"),
            notice_period_shortfall_days=shortfall_days,
            notice_recovery_amount=notice_recovery,
            advance_recovery=advance_recovery,
            asset_recovery=asset_recovery,
            other_recoveries=Decimal("0"),
            total_payable=total_payable,
            total_recovery=total_recovery,
            net_amount=net_amount,
            tds_on_gratuity=tds_on_gratuity,
            tds_on_leave_enc=Decimal("0"),  # Phase 3: regime-based
            computation_notes=notes,
        )

        logger.info("Final settlement computed", extra={
            "settlement_id": str(settlement.id),
            "employee_id": str(employee_id),
            "net_amount": str(net_amount),
        })
        return settlement

    @staticmethod
    def _compute_service_years(doj: date, last_day: date) -> float:
        """Returns years of service as float, using 240-day minimum for rounding."""
        delta = last_day - doj
        total_days = delta.days
        years = total_days / 365.25
        # For gratuity: round down to completed years
        return int(years * 10) / 10  # keep 1 decimal

    @staticmethod
    def _days_in_month(year: int, month: int) -> int:
        import calendar
        return calendar.monthrange(year, month)[1]
