# yss_orbit\backend\apps\core\services\timezone_service.py
"""
YSS Orbit — Timezone Service [B26]
Centralizes all timezone and date handling across ALL modules.

Rules (B26):
- ALL DB timestamps stored in UTC (TIMESTAMPTZ). NEVER store local time.
- Convert UTC → tenant timezone ONLY at display time.
- Convert tenant-local input → UTC ONLY at storage time.
- Celery Beat tasks use UTC schedule; converted to tenant tz at execution.

Usage:
    from apps.platform.services.timezone_service import TimezoneService

    # UTC → tenant display time
    display_dt = TimezoneService.to_tenant_tz(utc_dt, business_unit_id)

    # Naive local input → UTC for storage
    utc_dt = TimezoneService.to_utc(naive_local_dt, business_unit_id)
"""
from __future__ import annotations

import logging
import uuid
from datetime import datetime, date

import pytz
from django.utils import timezone as django_timezone

logger = logging.getLogger(__name__)

# Default timezone used when tenant TZ cannot be resolved
_DEFAULT_TZ = "Asia/Kolkata"

# In-memory cache: business_unit_id → timezone_name
_tz_cache: dict[str, str] = {}


def _get_tenant_timezone(business_unit_id: uuid.UUID) -> str:
    """
    Retrieve the tenant timezone name from settings cache.
    Falls back to DEFAULT_TZ if not configured.
    """
    key = str(business_unit_id)
    if key in _tz_cache:
        return _tz_cache[key]

    try:
        from django.core.cache import cache
        redis_key = f"settings:{key}"
        settings = cache.get(redis_key)
        if settings and isinstance(settings, dict):
            tz_name = settings.get("timezone", _DEFAULT_TZ)
        else:
            # Fallback: query DB directly
            from apps.tenancy.models import TenantSetting
            record = TenantSetting.objects.filter(
                business_unit_id=business_unit_id,
                key="timezone",
            ).first()
            tz_name = record.value if record else _DEFAULT_TZ

        # Validate
        try:
            pytz.timezone(tz_name)
        except pytz.UnknownTimeZoneError:
            logger.warning(
                "Unknown timezone '%s' for BU %s — using default.",
                tz_name,
                business_unit_id,
            )
            tz_name = _DEFAULT_TZ

        _tz_cache[key] = tz_name
        return tz_name

    except Exception as exc:
        logger.warning(
            "Could not resolve timezone for BU %s: %s — using default.",
            business_unit_id,
            exc,
        )
        return _DEFAULT_TZ


def _invalidate_tz_cache(business_unit_id: uuid.UUID) -> None:
    """Call this when a tenant's timezone setting changes."""
    _tz_cache.pop(str(business_unit_id), None)


class TimezoneService:
    """
    Centralized timezone conversion service [B26].
    All methods are static — no instance required.
    """

    @staticmethod
    def to_tenant_tz(
        utc_dt: datetime,
        business_unit_id: uuid.UUID,
    ) -> datetime:
        """
        Convert a UTC-aware datetime to the tenant's local timezone.
        Use ONLY for display purposes — NEVER store the result.

        Args:
            utc_dt: UTC-aware datetime (will be made UTC-aware if naive)
            business_unit_id: The tenant's business unit UUID

        Returns:
            Timezone-aware datetime in the tenant's local timezone
        """
        if utc_dt is None:
            return None

        # Ensure UTC-aware
        if django_timezone.is_naive(utc_dt):
            utc_dt = pytz.utc.localize(utc_dt)

        tz_name = _get_tenant_timezone(business_unit_id)
        tenant_tz = pytz.timezone(tz_name)
        return utc_dt.astimezone(tenant_tz)

    @staticmethod
    def to_utc(
        naive_local_dt: datetime,
        business_unit_id: uuid.UUID,
    ) -> datetime:
        """
        Convert a tenant-local naive datetime to UTC for DB storage.
        Use when accepting user input that is in tenant's local time.

        Args:
            naive_local_dt: Naive datetime in tenant's local timezone
            business_unit_id: The tenant's business unit UUID

        Returns:
            UTC-aware datetime ready for DB storage
        """
        if naive_local_dt is None:
            return None

        # If already UTC-aware, return as-is
        if django_timezone.is_aware(naive_local_dt):
            return naive_local_dt.astimezone(pytz.utc)

        tz_name = _get_tenant_timezone(business_unit_id)
        tenant_tz = pytz.timezone(tz_name)
        local_aware = tenant_tz.localize(naive_local_dt)
        return local_aware.astimezone(pytz.utc)

    @staticmethod
    def now_in_tenant_tz(business_unit_id: uuid.UUID) -> datetime:
        """Return current datetime in tenant's local timezone."""
        return TimezoneService.to_tenant_tz(django_timezone.now(), business_unit_id)

    @staticmethod
    def today_in_tenant_tz(business_unit_id: uuid.UUID) -> date:
        """Return today's date in the tenant's local timezone."""
        return TimezoneService.now_in_tenant_tz(business_unit_id).date()

    @staticmethod
    def get_timezone_name(business_unit_id: uuid.UUID) -> str:
        """Return the IANA timezone name for the tenant."""
        return _get_tenant_timezone(business_unit_id)

    @staticmethod
    def get_pytz_timezone(business_unit_id: uuid.UUID) -> pytz.BaseTzInfo:
        """Return the pytz timezone object for the tenant."""
        return pytz.timezone(_get_tenant_timezone(business_unit_id))

    @staticmethod
    def invalidate_cache(business_unit_id: uuid.UUID) -> None:
        """Invalidate the local TZ cache after a tenant settings update."""
        _invalidate_tz_cache(business_unit_id)

    @staticmethod
    def format_for_display(
        utc_dt: datetime,
        business_unit_id: uuid.UUID,
        fmt: str = "%d %b %Y, %I:%M %p %Z",
    ) -> str:
        """
        Format a UTC datetime as a localized display string.

        Args:
            utc_dt: UTC-aware datetime
            business_unit_id: Tenant BU UUID
            fmt: strftime format string

        Returns:
            Formatted string e.g. "28 May 2026, 08:30 PM IST"
        """
        if utc_dt is None:
            return ""
        local_dt = TimezoneService.to_tenant_tz(utc_dt, business_unit_id)
        return local_dt.strftime(fmt)
