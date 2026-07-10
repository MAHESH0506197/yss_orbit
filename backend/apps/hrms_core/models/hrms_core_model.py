# DEPRECATED - DO NOT USE. Scheduled for removal. Use apps.hrms instead.
# yss_orbit\backend\apps\hrms_core\models\hrms_core_model.py
# DEPRECATED — this base model class has been superseded by apps.platform.models.TenantModel.
# This model is retained for backward compatibility only. Do not extend or add fields.
# Scheduled for removal after full data migration to apps.hrms.models.
from django.db import models
from apps.platform.models.base import TenantModel

class HrmsCore(TenantModel):
    name = models.CharField(max_length=255)

    class Meta(TenantModel.Meta):
        abstract = True
