# yss_orbit\backend\core\utils\timezone_utils.py
"""
Timezone utilities.
"""
from __future__ import annotations

import pytz
from datetime import datetime
from django.utils import timezone

def make_aware(dt: datetime, timezone_str: str = "UTC") -> datetime:
    """Make a naive datetime timezone-aware."""
    tz = pytz.timezone(timezone_str)
    return timezone.make_aware(dt, tz) if timezone.is_naive(dt) else dt

def to_local(dt: datetime, timezone_str: str) -> datetime:
    """Convert a timezone-aware datetime to a specific local timezone."""
    tz = pytz.timezone(timezone_str)
    return dt.astimezone(tz)
