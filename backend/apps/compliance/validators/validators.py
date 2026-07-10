# yss_orbit\backend\apps\error_log\validators\validators.py
from rest_framework.exceptions import ValidationError

def validate_positive(value):
    if value < 0:
        raise ValidationError("Value must be positive.")
