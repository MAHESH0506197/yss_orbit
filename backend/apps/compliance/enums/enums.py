# yss_orbit\backend\apps\error_log\enums\enums.py
from django.db import models

class Status(models.TextChoices):
    ACTIVE = 'ACTIVE', 'Active'
    INACTIVE = 'INACTIVE', 'Inactive'
