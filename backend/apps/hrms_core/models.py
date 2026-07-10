# DEPRECATED - DO NOT USE. Scheduled for removal. Use apps.hrms instead.
# yss_orbit\backend\apps\hrms_core\models.py
# DEPRECATED
# Use apps.hrms.models instead.
# Retained only for backward compatibility.

from django.db import models
from apps.platform.models.base import TenantModel

class CompanyPolicy(TenantModel):
    title = models.CharField(max_length=255)
    content = models.TextField()
    effective_date = models.DateField()
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return self.title

class Holiday(TenantModel):
    name = models.CharField(max_length=255)
    date = models.DateField()
    description = models.TextField(blank=True)

    def __str__(self):
        return f"{self.name} - {self.date}"
