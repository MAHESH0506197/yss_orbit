# yss_orbit\backend\apps\user_business_unit\validators\validators.py
from django.core.exceptions import ValidationError

def validate_membership(user, business_unit):
    """
    Ensures that a user can be validly assigned to a business unit.
    """
    if not getattr(user, 'is_active', False):
        raise ValidationError("User is inactive and cannot be assigned to a business unit.")
    if not getattr(business_unit, 'is_active', False):
        raise ValidationError("Business unit is inactive.")
