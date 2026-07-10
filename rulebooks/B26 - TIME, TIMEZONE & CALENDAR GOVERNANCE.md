<!-- yss_orbit\rulebooks\B26 - TIME, TIMEZONE & CALENDAR GOVERNANCE.md -->
# B26 - TIME, TIMEZONE & CALENDAR GOVERNANCE

**Version:** v4.0 ENTERPRISE FINAL
**Status:** PRODUCTION LAW
**Series:** Backend Platform Governance
**Depends On:** B01, B02 (Multi-Tenant), B08 (Database), B12 (Tenant Settings - timezone setting)
**Governance Role:** Time & Calendar Standards Authority

---

## RULEBOOK OWNERSHIP

| Concern | Status |
|---------|--------|
| OWNS | UTC storage standard, timezone conversion rules, DST (Daylight Saving Time) handling, payroll cutoff time governance, overnight shift rules, attendance time governance, calendar (holiday, working days) management, payroll period definition standards |
| REFERENCES | B12 (tenant_settings - timezone, working_days, payroll_cutoff_day), B08 (TIMESTAMPTZ vs TIMESTAMP - always TIMESTAMPTZ), B02 (tenant isolation - timezone is per-BusinessUnit) |
| MUST NOT DUPLICATE | Tenant settings schema (B12), database column standards (B08) |

---

## 1. PURPOSE

Attendance and payroll systems die from timezone errors. A payroll system that computes the wrong cutoff date due to DST causes incorrect salary payments - a direct legal and financial liability.

This rulebook defines the non-negotiable time handling standards that prevent:
- Payroll cutoff date errors due to timezone/DST misalignment
- Attendance records shifting to wrong dates at DST boundaries
- Overnight shift workers appearing "absent" due to date boundary confusion
- Multi-branch tenants (in different timezones) having cross-contaminated attendance records

---

## 2. UNIVERSAL STORAGE STANDARD (MANDATORY)

### 2.1 All Timestamps in UTC - Always

**WHAT:** ALL timestamps stored in the database MUST be in UTC using `TIMESTAMPTZ` (timestamp with timezone).

**WHY:** If timestamps are stored in local time without timezone info:
- A shift that starts 23:45 on Tuesday and ends 01:30 on Wednesday gets recorded as "Tuesday shift: 23:45 → 01:30" - the date boundary is wrong
- When the tenant changes their timezone setting, all historical data appears shifted
- DST transitions cause 1-hour gaps or 1-hour duplicates in attendance records

**HOW:**
```sql
-- REQUIRED: TIMESTAMPTZ for all time columns
check_in   TIMESTAMPTZ NOT NULL,    -- stored as UTC
check_out  TIMESTAMPTZ,             -- stored as UTC

-- PROHIBITED: TIMESTAMP without timezone
check_in   TIMESTAMP NOT NULL,      -- NEVER - timezone-naive
check_in   TIME NOT NULL,           -- NEVER for cross-day data
```

```python
# REQUIRED: always use timezone-aware datetime in Python
from django.utils import timezone

# CORRECT:
now = timezone.now()                 # Returns UTC-aware datetime
check_in = timezone.now()

# PROHIBITED:
import datetime
now = datetime.datetime.now()        # Timezone-naive - NEVER in production code
now = datetime.datetime.utcnow()    # Still naive (no tzinfo) - NEVER
```

### 2.2 Display Conversion at the Boundary Only

```python
# CORRECT - convert to tenant timezone ONLY at display time:
def get_attendance_display(record: AttendanceLog, tenant_tz: str) -> dict:
    tz = pytz.timezone(tenant_tz)
    return {
        'check_in_local': record.check_in.astimezone(tz).isoformat(),
        'check_in_utc': record.check_in.isoformat(),
        'display_date': record.check_in.astimezone(tz).date(),
    }

# PROHIBITED - converting to local time before storing:
def record_checkin(employee_id, local_time_str, tenant_tz):
    local_dt = datetime.strptime(local_time_str, '%Y-%m-%dT%H:%M:%S')
    # NEVER store local_dt - it loses timezone info
    AttendanceLog.objects.create(check_in=local_dt)   # WRONG - timezone-naive

# CORRECT:
def record_checkin(employee_id, utc_time: datetime, ctx):
    AttendanceLog.objects.create(
        check_in=utc_time,   # UTC-aware from client
        employee_id=employee_id,
        business_unit_id=ctx.selected_business_unit_id,
    )
```

---

## 3. TENANT TIMEZONE GOVERNANCE (MANDATORY)

### 3.1 Timezone is Per BusinessUnit

Each BusinessUnit has its own timezone stored in `tenant_settings`:

```
Key: 'timezone'
Value: IANA timezone string (e.g., 'Asia/Kolkata', 'America/New_York', 'Europe/London')
Default: 'Asia/Kolkata' (for Indian platform)
```

**VALID timezone values:** IANA Time Zone Database names only (e.g., `Asia/Kolkata`, not `IST` - abbreviations are ambiguous and PROHIBITED).

```python
# PROHIBITED - ambiguous timezone abbreviations:
tz = pytz.timezone('IST')       # IST = India Standard Time OR Israel Standard Time
tz = pytz.timezone('EST')       # EST = Eastern Standard Time (does not handle DST)

# REQUIRED - unambiguous IANA names:
tz = pytz.timezone('Asia/Kolkata')      # ✓
tz = pytz.timezone('America/New_York')  # ✓ (handles EDT/EST automatically)
tz = pytz.timezone('Europe/London')     # ✓ (handles GMT/BST automatically)
```

### 3.2 Date Calculation Must Use Tenant Timezone (MANDATORY)

When determining which calendar date an attendance record belongs to, use the tenant's timezone - not UTC.

```python
def get_attendance_date(check_in_utc: datetime, tenant_tz: str) -> date:
    """
    Determines the LOCAL calendar date for an attendance record.
    A check-in at 23:50 UTC on June 15 in IST (UTC+5:30)
    is June 16 in IST - must be recorded as June 16 attendance.
    """
    tz = pytz.timezone(tenant_tz)
    local_dt = check_in_utc.astimezone(tz)
    return local_dt.date()

# Example:
# check_in = 2025-06-15T23:50:00Z (UTC)
# tenant_tz = 'Asia/Kolkata' (UTC+5:30)
# local = 2025-06-16T05:20:00+05:30
# attendance_date = 2025-06-16  (June 16, not June 15)
```

**This rule prevents the most common attendance error** - an employee checking in just before midnight UTC being recorded as the previous day.

---

## 4. PAYROLL CUTOFF GOVERNANCE (MANDATORY)

### 4.1 Payroll Cutoff Date Calculation

The payroll cutoff date determines which attendance records and leave records are included in a payroll run. Getting this wrong means wrong salary payments.

```python
def calculate_payroll_period(
    month: int,
    year: int,
    cutoff_day: int,
    tenant_tz: str,
) -> PayrollPeriod:
    """
    Calculates the exact payroll period in the tenant's timezone.

    Example:
      cutoff_day = 25, month = 6, year = 2025, tz = 'Asia/Kolkata'
      Period: 2025-05-26 00:00:00 IST → 2025-06-25 23:59:59 IST
      In UTC: 2025-05-25T18:30:00Z → 2025-06-25T18:29:59Z
    """
    tz = pytz.timezone(tenant_tz)

    # Period END: cutoff_day of current month at 23:59:59 in tenant TZ
    end_local = tz.localize(
        datetime(year, month, cutoff_day, 23, 59, 59)
    )

    # Period START: day after cutoff of PREVIOUS month at 00:00:00 in tenant TZ
    # FIX: Calculate previous month/year correctly to avoid year-boundary bug (month=1 case)
    prev_month_for_check = month - 1 if month > 1 else 12
    prev_year_for_check = year if month > 1 else year - 1
    if cutoff_day == calendar.monthrange(prev_year_for_check, prev_month_for_check)[1]:
        # Cutoff is last day of month - start is 1st of this month
        start_local = tz.localize(datetime(year, month, 1, 0, 0, 0))
    else:
        prev_month = month - 1 if month > 1 else 12
        prev_year = year if month > 1 else year - 1
        start_local = tz.localize(
            datetime(prev_year, prev_month, cutoff_day + 1, 0, 0, 0)
        )

    return PayrollPeriod(
        start_utc=start_local.astimezone(pytz.UTC),
        end_utc=end_local.astimezone(pytz.UTC),
        start_local=start_local,
        end_local=end_local,
        tenant_tz=tenant_tz,
    )
```

### 4.2 DST Transition Handling for Payroll (MANDATORY)

When DST transitions occur during a payroll period:
- Use `pytz.localize()` with `is_dst=False` for ambiguous times (clocks fall back)
- Log a WARNING in structured logs when DST transition falls within a payroll period
- The payroll run summary MUST display the UTC period boundaries alongside local boundaries

```python
# Handle DST ambiguity (clocks fall back - 1-hour overlap):
try:
    local_dt = tz.localize(naive_dt, is_dst=None)
except pytz.exceptions.AmbiguousTimeError:
    # During DST fallback, use the EARLIER (DST) time to avoid missing data
    local_dt = tz.localize(naive_dt, is_dst=True)
    logger.warning(
        "DST ambiguous time in payroll period calculation",
        extra={'naive_dt': str(naive_dt), 'tenant_tz': str(tz)}
    )
```

---

## 5. OVERNIGHT SHIFT GOVERNANCE (MANDATORY)

### 5.1 The Overnight Shift Problem

An employee working a night shift from 22:00 to 06:00 the next day:
- Starts: Monday 22:00 (local time)
- Ends: Tuesday 06:00 (local time)

Naive systems record this as:
- Monday attendance: check_in=22:00, check_out=NULL (because 06:00 is on Tuesday)
- Tuesday attendance: check_in=NULL, check_out=06:00

This causes BOTH days to appear as partial/absent.

### 5.2 Overnight Shift Configuration (MANDATORY per tenant settings)

```python
# Tenant settings for overnight shifts:
# Key: 'overnight_shift_enabled'   Value: 'true' | 'false'
# Key: 'shift_day_boundary_hour'   Value: '4' (integer, 0-11; shifts crossing this hour belong to previous day)
# NOTE: 'overnight_shift_cutoff' (time string) is RETIRED — use 'shift_day_boundary_hour' (integer) exclusively
```

### 5.3 Overnight Attendance Record Logic

```python
def determine_attendance_date(
    check_in_utc: datetime,
    check_out_utc: Optional[datetime],
    tenant_tz: str,
    shift_day_boundary_hour: int = 4,  # from tenant_settings
) -> date:
    """
    For overnight shifts, the attendance DATE is determined by check-in.
    A shift starting Monday 22:00 and ending Tuesday 06:00:
      → Records as Monday (check-in day), not Tuesday (check-out day).

    Exception: If check-in is between midnight and boundary_hour (e.g., 01:00–04:00),
    it is treated as the PREVIOUS calendar day's overnight continuation.
    """
    tz = pytz.timezone(tenant_tz)
    check_in_local = check_in_utc.astimezone(tz)

    # If check-in is very early morning (before boundary), it belongs to previous day
    if check_in_local.hour < shift_day_boundary_hour:
        attendance_date = check_in_local.date() - timedelta(days=1)
    else:
        attendance_date = check_in_local.date()

    return attendance_date
```

---

## 6. HOLIDAY & WORKING DAY CALENDAR (MANDATORY)

### 6.1 Holiday Calendar Schema

```sql
CREATE TABLE holiday_calendar (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_unit_id UUID NOT NULL REFERENCES business_units(id),
    holiday_date     DATE NOT NULL,
    name             VARCHAR(200) NOT NULL,
    holiday_type     VARCHAR(20) NOT NULL DEFAULT 'public',
                     -- 'public' | 'optional' | 'restricted'
    is_paid          BOOLEAN NOT NULL DEFAULT TRUE,
    created_by       UUID REFERENCES users(id),
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(business_unit_id, holiday_date)
);

CREATE INDEX idx_holiday_bu_date ON holiday_calendar(business_unit_id, holiday_date);
```

### 6.2 Working Days Configuration

```python
# From tenant_settings:
# Key: 'working_days'  Value: '["MON","TUE","WED","THU","FRI","SAT"]'

def is_working_day(date: date, business_unit_id: UUID, settings: TenantSettings) -> bool:
    """Returns True if the given date is a working day for the tenant."""
    working_days = settings.get('working_days', ['MON','TUE','WED','THU','FRI'])
    day_name = date.strftime('%a').upper()[:3]  # 'MON', 'TUE', etc.

    if day_name not in working_days:
        return False  # Weekend per tenant config

    # Check holiday calendar
    is_holiday = HolidayCalendar.objects.filter(
        business_unit_id=business_unit_id,
        holiday_date=date,
    ).exists()

    return not is_holiday
```

### 6.3 Payroll Working Day Count (MANDATORY)

Payroll MUST use tenant-aware working day count - not raw calendar days:

```python
def count_working_days(
    start_date: date,
    end_date: date,
    business_unit_id: UUID,
    settings: TenantSettings,
) -> int:
    """
    Counts actual working days in a period:
    - Excludes tenant-configured weekends
    - Excludes holidays in the tenant's holiday calendar
    - Uses tenant's working_days setting
    """
    count = 0
    current = start_date
    while current <= end_date:
        if is_working_day(current, business_unit_id, settings):
            count += 1
        current += timedelta(days=1)
    return count
```

---

## 7. NON-NEGOTIABLE RULES

- `TIMESTAMP` (without timezone) in any DB column = PROHIBITED (use `TIMESTAMPTZ`)
- `datetime.datetime.now()` in production code = PROHIBITED (use `timezone.now()`)
- Timezone abbreviations ('IST', 'EST') = PROHIBITED (use IANA names)
- Attendance date computed in UTC instead of tenant timezone = PROHIBITED
- Payroll cutoff computed without tenant timezone = PROHIBITED
- DST transitions handled without `pytz.localize()` = PROHIBITED
- Holiday calendar not tenant-scoped = PROHIBITED (CRITICAL isolation violation)
- Overnight shifts treated as two separate incomplete records = PROHIBITED
- Payroll period boundary times not logged in UTC alongside local = PROHIBITED

---

*THIS RULEBOOK IS FINALIZED. ALL CHANGES REQUIRE ARB APPROVAL.*
