# yss_orbit\backend\apps\rbac\validators\validators.py
from django.core.exceptions import ValidationError

def validate_name(name):
    if not name:
        raise ValidationError('Name cannot be empty')
    return name
