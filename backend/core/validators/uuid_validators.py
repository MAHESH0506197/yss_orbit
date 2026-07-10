# yss_orbit\backend\core\validators\uuid_validators.py
"""
UUID validators.
"""
import uuid
from django.core.exceptions import ValidationError

def validate_uuid4(value):
    try:
        val = uuid.UUID(value, version=4)
    except ValueError:
        raise ValidationError("Invalid UUID format.")
