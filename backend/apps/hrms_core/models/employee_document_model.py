# DEPRECATED - DO NOT USE. Scheduled for removal. Use apps.hrms instead.
# yss_orbit\backend\apps\hrms_core\models\employee_document_model.py
# DEPRECATED — use apps.hrms.models.EmployeeDocument instead.
# This model is retained for backward compatibility only. Do not extend or add fields.
# Scheduled for removal after full data migration to apps.hrms.models.
from django.db import models
from apps.platform.models.base import TenantModel

class EmployeeDocument(TenantModel):
    name = models.CharField(max_length=255)

    class Meta(TenantModel.Meta):
        abstract = True
