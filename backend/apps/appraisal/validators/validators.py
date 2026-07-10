# yss_orbit\backend\apps\appraisal\validators\validators.py
from rest_framework.exceptions import ValidationError
from django.utils.translation import gettext_lazy as _

def validate_positive_quantity(value):
    if value is not None and value < 0:
        raise ValidationError(_("Value cannot be negative."))

def validate_date_range(start_date, end_date):
    if start_date and end_date and start_date > end_date:
        raise ValidationError(_("Start date cannot be after end date."))
