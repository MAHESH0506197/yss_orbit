# yss_orbit\backend\apps\core\services\calendar_service.py
"""
YSS Orbit — Business Calendar Service [B26]
Centralizes working-day and financial-period logic across ALL modules.

Rules:
- Uses tenant's holiday calendar (from DB)
- Working week respects tenant's configured working days
- Financial year starts from tenant_settings.financial_year_start (April = Indian standard)
- Payroll period uses tenant_settings.payroll_cycle_day + financial year

Usage:
    from apps.platform.services.calendar_service import BusinessCalendarService

    is_working = BusinessCalendarService.is_working_day(date(2026, 1, 26), bu_id)
    next_day = BusinessCalendarService.next_working_day(date(2026, 1, 26), bu_id)
    period = BusinessCalendarService.get_financial_period(date.today(), bu_id)
"""
from __future__ import annotations

import logging
import uuid
from datetime import date, timedelta
from typing import NamedTuple

logger = logging.getLogger(__name__)

# Default working days: Monday=0 ... Sunday=6
_DEFAULT_WORKING_DAYS = {0, 1, 2, 3, 4}  # Mon–Fri
_DEFAULT_FINANCIAL_YEAR_START_MONTH = 4   # April (India)
_DEFAULT_PAYROLL_CYCLE_DAY = 1            # 1st of each month


class FinancialPeriod(NamedTuple):
    """Represents a financial month period."""
    year: int          # Financial year (e.g. 2026 for FY 2025-26)
    month: int         # Calendar month (1-12)
    period_label: str  # e.g. "Apr 2025 (FY 2025-26)"
    fy_start: date     # First day of the financial year
    fy_end: date       # Last day of the financial year
    period_start: date # First day of the period month
    period_end: date   # Last day of the period month


class PayrollPeriod(NamedTuple):
    """Represents a payroll period."""
    period_month: int   # Calendar month (1-12)
    period_year: int    # Calendar year
    start_date: date    # Payroll period start
    end_date: date      # Payroll period end
    label: str          # e.g. "May 2026"


def _get_tenant_settings(business_unit_id: uuid.UUID) -> dict:
    """Load tenant settings with cache fallback."""
    from django.core.cache import cache
    key = f"settings:{business_unit_id}"
    cached = cache.get(key)
    if cached and isinstance(cached, dict):
        return cached

    try:
        from apps.tenancy.models import TenantSetting
        settings_qs = TenantSetting.objects.filter(
            business_unit_id=business_unit_id
        ).values_list("key", "value")
        settings = dict(settings_qs)
        cache.set(key, settings, timeout=300)
        return settings
    except Exception as exc:
        logger.warning("Could not load tenant settings for BU %s: %s", business_unit_id, exc)
        return {}


def _get_holiday_set(business_unit_id: uuid.UUID, year: int) -> set[date]:
    """Load holidays for a given year from DB, with Redis cache."""
    from django.core.cache import cache
    cache_key = f"holidays:{business_unit_id}:{year}"
    cached = cache.get(cache_key)
    if cached is not None:
        return cached

    try:
        # Try to load from a holiday model if it exists
        # This is a safe fallback — if the model doesn't exist yet, return empty set
        holiday_set: set[date] = set()
        try:
            from apps.hrms.models import Holiday
            holidays = Holiday.objects.filter(
                business_unit_id=business_unit_id,
                holiday_date__year=year,
            ).values_list("holiday_date", flat=True)
            holiday_set = set(holidays)
        except Exception:
            pass  # attendance app not yet set up — no holidays

        cache.set(cache_key, holiday_set, timeout=3600)
        return holiday_set
    except Exception as exc:
        logger.warning("Could not load holidays for BU %s year %s: %s", business_unit_id, year, exc)
        return set()


class BusinessCalendarService:
    """
    Centralized business calendar service [B26].
    Handles working days, holidays, financial periods, payroll periods.
    """

    @staticmethod
    def is_working_day(check_date: date, business_unit_id: uuid.UUID) -> bool:
        """
        Returns True if the given date is a working day for the tenant.

        Rules:
        1. Check if weekday is in the tenant's configured working days
        2. Check if the date is a public/company holiday

        Args:
            check_date: The date to check
            business_unit_id: Tenant BU UUID

        Returns:
            True if working day, False if weekend or holiday
        """
        settings = _get_tenant_settings(business_unit_id)

        # Parse working days from settings (stored as comma-separated weekday numbers)
        working_days_str = settings.get("working_days", "")
        if working_days_str:
            try:
                working_days = {int(d) for d in working_days_str.split(",") if d.strip().isdigit()}
            except (ValueError, AttributeError):
                working_days = _DEFAULT_WORKING_DAYS
        else:
            working_days = _DEFAULT_WORKING_DAYS

        # Check weekday (Monday=0, Sunday=6)
        if check_date.weekday() not in working_days:
            return False

        # Check holidays
        holidays = _get_holiday_set(business_unit_id, check_date.year)
        if check_date in holidays:
            return False

        return True

    @staticmethod
    def next_working_day(from_date: date, business_unit_id: uuid.UUID) -> date:
        """
        Returns the next working day after from_date.
        Skips weekends and holidays.

        Args:
            from_date: Starting date (exclusive — returns NEXT working day)
            business_unit_id: Tenant BU UUID

        Returns:
            The next working day
        """
        candidate = from_date + timedelta(days=1)
        max_iterations = 365  # Safety guard against infinite loops
        for _ in range(max_iterations):
            if BusinessCalendarService.is_working_day(candidate, business_unit_id):
                return candidate
            candidate += timedelta(days=1)

        # Fallback — should never happen
        logger.error(
            "Could not find next working day within 365 days from %s for BU %s",
            from_date,
            business_unit_id,
        )
        return candidate

    @staticmethod
    def get_financial_year_start(business_unit_id: uuid.UUID, for_date: date) -> date:
        """
        Get the start date of the financial year that contains for_date.
        Defaults to April 1 (Indian FY).

        Args:
            business_unit_id: Tenant BU UUID
            for_date: The reference date

        Returns:
            First day of the relevant financial year
        """
        settings = _get_tenant_settings(business_unit_id)
        try:
            fy_start_month = int(settings.get("financial_year_start", _DEFAULT_FINANCIAL_YEAR_START_MONTH))
        except (ValueError, TypeError):
            fy_start_month = _DEFAULT_FINANCIAL_YEAR_START_MONTH

        if for_date.month >= fy_start_month:
            return date(for_date.year, fy_start_month, 1)
        else:
            return date(for_date.year - 1, fy_start_month, 1)

    @staticmethod
    def get_financial_period(
        reference_date: date,
        business_unit_id: uuid.UUID,
    ) -> FinancialPeriod:
        """
        Get the financial period (month within FY) for a given date.

        Args:
            reference_date: The date to get the period for
            business_unit_id: Tenant BU UUID

        Returns:
            FinancialPeriod named tuple with all period details
        """
        import calendar

        fy_start = BusinessCalendarService.get_financial_year_start(
            business_unit_id, reference_date
        )

        # Calculate FY end (last day of month before fy_start in the next year)
        fy_start_month = fy_start.month
        if fy_start_month == 1:
            fy_end = date(fy_start.year + 1, 1, 1) - timedelta(days=1)
        else:
            fy_end = date(fy_start.year + 1, fy_start_month, 1) - timedelta(days=1)

        # Period start/end
        period_start = date(reference_date.year, reference_date.month, 1)
        last_day = calendar.monthrange(reference_date.year, reference_date.month)[1]
        period_end = date(reference_date.year, reference_date.month, last_day)

        # FY label: if April start, FY 2025-26 for April 2025
        fy_year_label = f"{fy_start.year}-{str(fy_end.year)[-2:]}"
        month_name = reference_date.strftime("%b %Y")
        label = f"{month_name} (FY {fy_year_label})"

        return FinancialPeriod(
            year=fy_start.year,
            month=reference_date.month,
            period_label=label,
            fy_start=fy_start,
            fy_end=fy_end,
            period_start=period_start,
            period_end=period_end,
        )

    @staticmethod
    def get_payroll_period(
        reference_date: date,
        business_unit_id: uuid.UUID,
    ) -> PayrollPeriod:
        """
        Get the payroll period for a reference date.
        Respects tenant's payroll_cycle_day setting.

        If cycle_day=1: period is 1st–last of the month for reference_date.
        If cycle_day=26: period is 26th of prev month to 25th of current.

        Args:
            reference_date: The date to get the payroll period for
            business_unit_id: Tenant BU UUID

        Returns:
            PayrollPeriod named tuple
        """
        import calendar

        settings = _get_tenant_settings(business_unit_id)
        try:
            cycle_day = int(settings.get("payroll_cycle_day", _DEFAULT_PAYROLL_CYCLE_DAY))
            cycle_day = max(1, min(28, cycle_day))  # Clamp 1–28
        except (ValueError, TypeError):
            cycle_day = _DEFAULT_PAYROLL_CYCLE_DAY

        if cycle_day == 1:
            # Standard: 1st to last of reference month
            period_start = date(reference_date.year, reference_date.month, 1)
            last_day = calendar.monthrange(reference_date.year, reference_date.month)[1]
            period_end = date(reference_date.year, reference_date.month, last_day)
            period_month = reference_date.month
            period_year = reference_date.year
        else:
            # Cycle: cycle_day of prev month to (cycle_day - 1) of current month
            if reference_date.day >= cycle_day:
                # We are in the current pay period: cycle_day of this month to cycle_day-1 of next
                period_start = date(reference_date.year, reference_date.month, cycle_day)
                # End = (cycle_day - 1) of next month
                if reference_date.month == 12:
                    period_end = date(reference_date.year + 1, 1, cycle_day - 1)
                    period_month = 1
                    period_year = reference_date.year + 1
                else:
                    period_end = date(reference_date.year, reference_date.month + 1, cycle_day - 1)
                    period_month = reference_date.month + 1
                    period_year = reference_date.year
            else:
                # We are before cycle_day: period started last month
                if reference_date.month == 1:
                    period_start = date(reference_date.year - 1, 12, cycle_day)
                else:
                    period_start = date(reference_date.year, reference_date.month - 1, cycle_day)
                period_end = date(reference_date.year, reference_date.month, cycle_day - 1)
                period_month = reference_date.month
                period_year = reference_date.year

        label = date(period_year, period_month, 1).strftime("%B %Y")
        return PayrollPeriod(
            period_month=period_month,
            period_year=period_year,
            start_date=period_start,
            end_date=period_end,
            label=label,
        )
