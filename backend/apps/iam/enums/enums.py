# yss_orbit\backend\apps\rbac\enums\enums.py
from django.db import models

class StatusChoices(models.TextChoices):
    ACTIVE = 'active', 'Active'
    INACTIVE = 'inactive', 'Inactive'
