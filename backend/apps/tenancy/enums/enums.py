# yss_orbit\backend\apps\domain\enums\enums.py
from django.db import models
from django.utils.translation import gettext_lazy as _

class StatusChoices(models.TextChoices):
    ACTIVE = 'active', _('Active')
    INACTIVE = 'inactive', _('Inactive')
