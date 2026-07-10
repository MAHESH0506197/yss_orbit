# yss_orbit\backend\apps\domain\validators\validators.py
from django.core.exceptions import ValidationError
from django.utils.translation import gettext_lazy as _

def validate_positive(value):
    if value < 0:
        raise ValidationError(_('Value must be positive'))
