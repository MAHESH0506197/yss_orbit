# DEPRECATED - DO NOT USE. Scheduled for removal. Use apps.hrms instead.
# yss_orbit\backend\apps\hrms_core\validators\validators.py
from django.core.exceptions import ValidationError

def validate_employee_id(value):
    if not value.isalnum():
        raise ValidationError("Employee ID must be alphanumeric.")

def validate_probation_period(days):
    if days < 0:
        raise ValidationError("Probation period cannot be negative.")
