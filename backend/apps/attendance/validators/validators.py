# yss_orbit\backend\apps\attendance\validators\validators.py
from django.core.exceptions import ValidationError

def validate_working_hours(value):
    if value < 0 or value > 24:
        raise ValidationError("Working hours must be between 0 and 24.")

def validate_overtime_hours(value):
    if value < 0:
        raise ValidationError("Overtime hours cannot be negative.")
