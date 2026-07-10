# yss_orbit\backend\apps\user_business_unit\enums\enums.py
from django.db import models

class StatusChoices(models.TextChoices):
    ACTIVE = 'active', 'Active'
    INACTIVE = 'inactive', 'Inactive'
