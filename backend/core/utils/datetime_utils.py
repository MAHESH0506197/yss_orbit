# yss_orbit\backend\core\utils\datetime_utils.py
"""
Datetime utilities.
"""
from __future__ import annotations

from datetime import date, datetime, timedelta
from django.utils import timezone

def now() -> datetime:
    """Return timezone-aware current datetime."""
    return timezone.now()

def today() -> date:
    """Return current timezone-aware date."""
    return timezone.now().date()

def hours_from_now(hours: int) -> datetime:
    """Return datetime `hours` from now."""
    return timezone.now() + timedelta(hours=hours)

def days_from_now(days: int) -> datetime:
    """Return datetime `days` from now."""
    return timezone.now() + timedelta(days=days)

def is_expired(target_time: datetime) -> bool:
    """Check if the provided datetime is in the past."""
    return timezone.now() > target_time
