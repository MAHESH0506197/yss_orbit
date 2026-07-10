# yss_orbit\backend\core\validators\tenant_validators.py
"""
Tenant validators.
"""
import re
from django.core.exceptions import ValidationError

def validate_tenant_domain(value):
    if not re.match(r'^[a-z0-9]([a-z0-9-]*[a-z0-9])?$', value):
        raise ValidationError("Invalid tenant domain. Use only lowercase letters, numbers, and hyphens.")
