from django.db import models
from apps.platform.models.base import TenantModel


class Shift(TenantModel):
    """
    Defines a work shift configuration.
    Supports fixed, rotational, flexible, split, and night shifts.
    Employees are assigned to a shift via Employee.shift (default).
    For rotational shifts, ShiftRoster overrides the default assignment per day.
    """

    class ShiftType(models.TextChoices):
        FIXED       = 'FIXED',       'Fixed (same time every day)'
        ROTATIONAL  = 'ROTATIONAL',  'Rotational (changes via roster)'
        FLEXIBLE    = 'FLEXIBLE',    'Flexible (within core hours)'
        SPLIT       = 'SPLIT',       'Split (two separate working windows)'
        NIGHT       = 'NIGHT',       'Night Shift (crosses midnight)'

    name                = models.CharField(max_length=50)  # e.g., 'General Shift', 'Night A'
    shift_type          = models.CharField(max_length=12, choices=ShiftType.choices, default=ShiftType.FIXED, db_index=True)
    start_time          = models.TimeField()
    end_time            = models.TimeField()
    grace_time_minutes  = models.IntegerField(default=15)
    break_duration_minutes = models.IntegerField(default=0, help_text="Total scheduled break time in minutes")
    overnight_shift     = models.BooleanField(default=False, help_text="True if shift end_time is on the next calendar day")
    work_days           = models.JSONField(
        default=list,
        help_text="Array of working days (0=Monday, 6=Sunday). Default: [0, 1, 2, 3, 4]"
    )
    is_active           = models.BooleanField(default=True)

    class Meta(TenantModel.Meta):
        db_table = 'hrms_shifts'
        ordering = ['name']

    def __str__(self) -> str:
        return f"{self.name} ({self.start_time.strftime('%H:%M')} - {self.end_time.strftime('%H:%M')}) [{self.shift_type}]"

