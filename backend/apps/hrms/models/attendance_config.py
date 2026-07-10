# yss_orbit/backend/apps/hrms/models/attendance_config.py
"""
Enterprise Attendance Extension Models.

AttendanceConfig holds geo-fencing and biometric configuration stubs.
ShiftRoster enables day-by-day shift assignment for rotational shift employees.
Both are implemented as capability stubs with config flags now;
hardware integrations (biometric device sync, face recognition API) are Phase 2.
"""
from django.db import models
from apps.platform.models.base import TenantModel


class AttendanceConfig(TenantModel):
    """
    BU-level attendance configuration for geo-fencing, biometric, and mobile check-in.

    Config flags allow HR to enable/disable capabilities per BU.
    Full hardware integrations are Phase 2 — this model persists the config
    so the UI can display capability states and the API can validate accordingly.

    Geo-fencing: attendance_date records within radius of geo_latitude/geo_longitude
    are marked as valid. GPS is verified server-side.
    """
    # Geo-fencing
    geo_fencing_enabled = models.BooleanField(default=False)
    geo_latitude        = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    geo_longitude       = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    geo_radius_meters   = models.PositiveIntegerField(default=500)
    geo_location_name   = models.CharField(max_length=200, blank=True)  # "Head Office, Bangalore"

    # Biometric Device Integration (stub — Phase 2)
    biometric_sync_enabled = models.BooleanField(default=False)
    biometric_device_id    = models.CharField(max_length=100, blank=True)
    biometric_device_type  = models.CharField(
        max_length=30, blank=True,
        choices=[
            ('FINGERPRINT', 'Fingerprint Scanner'),
            ('FACE', 'Face Recognition Device'),
            ('CARD', 'RFID Card Reader'),
            ('PIN', 'PIN-Based'),
        ]
    )
    biometric_sync_url     = models.URLField(blank=True)  # Device API endpoint

    # Mobile GPS Check-in
    mobile_checkin_enabled = models.BooleanField(default=False)

    # Face Recognition (stub — Phase 2)
    face_recognition_enabled = models.BooleanField(default=False)

    # Working Day Defaults
    default_working_days_per_month = models.PositiveIntegerField(default=26)
    auto_generate_daily_attendance = models.BooleanField(default=True)

    class Meta(TenantModel.Meta):
        db_table = 'hrms_attendance_config'

    def __str__(self) -> str:
        features = []
        if self.geo_fencing_enabled:
            features.append('Geo')
        if self.biometric_sync_enabled:
            features.append('Biometric')
        if self.mobile_checkin_enabled:
            features.append('Mobile GPS')
        return f"AttendanceConfig [{', '.join(features) or 'Default'}]"


class ShiftRoster(TenantModel):
    """
    Day-by-day shift assignment for rotational shift employees.

    For FIXED shift employees, this table is not used — Employee.shift applies.
    For ROTATIONAL employees, this table overrides the daily shift assignment.
    Created by HR when publishing monthly roster.

    Auto-assignment: if is_auto_assigned=True, the Celery task placed the employee
    in this shift based on rotation rules; manual entries have is_auto_assigned=False.
    """
    employee_id      = models.UUIDField(db_index=True)  # Soft FK to hrms.Employee
    shift            = models.ForeignKey('hrms.Shift', on_delete=models.PROTECT, related_name='roster_entries')
    roster_date      = models.DateField(db_index=True)
    is_auto_assigned = models.BooleanField(default=False)
    notes            = models.CharField(max_length=200, blank=True)

    class Meta(TenantModel.Meta):
        db_table = 'hrms_shift_rosters'
        unique_together = [('business_unit_id', 'employee_id', 'roster_date')]
        indexes = [
            models.Index(fields=['business_unit_id', 'roster_date']),
            models.Index(fields=['business_unit_id', 'employee_id', 'roster_date']),
        ]

    def __str__(self) -> str:
        return f"Roster: {self.employee_id} on {self.roster_date} → {self.shift.name}"
