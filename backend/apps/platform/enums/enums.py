# yss_orbit\backend\apps\outbox\enums\enums.py
from django.db import models

class Status(models.TextChoices):
    ACTIVE = 'ACTIVE', 'Active'
    INACTIVE = 'INACTIVE', 'Inactive'
