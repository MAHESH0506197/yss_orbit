# DEPRECATED - DO NOT USE. Scheduled for removal. Use apps.hrms instead.
# yss_orbit\backend\apps\hrms_core\models\employee_profile_model.py
# DEPRECATED — use apps.hrms.models.Employee instead (profile data is on the Employee model).
# This model is retained for backward compatibility only. Do not extend or add fields.
# Scheduled for removal after full data migration to apps.hrms.models.
from django.db import models
from apps.platform.models.base import TenantModel

class EmployeeProfile(TenantModel):
    name = models.CharField(max_length=255)

    class Meta(TenantModel.Meta):
        abstract = True
