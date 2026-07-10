# yss_orbit\backend\apps\tenant_settings\models\tenant_settings_model.py
import uuid
from django.db import models
from apps.platform.models.base import TenantModel

class TenantSetting(TenantModel):
    class ValueType(models.TextChoices):
        STRING = "STRING", "String"
        INTEGER = "INTEGER", "Integer"
        BOOLEAN = "BOOLEAN", "Boolean"
        JSON = "JSON", "JSON Object"

    key = models.CharField(max_length=255)
    value = models.TextField()
    value_type = models.CharField(max_length=50, choices=ValueType.choices, default=ValueType.STRING)
    description = models.TextField(blank=True)
    is_public = models.BooleanField(default=False)

    class Meta(TenantModel.Meta):
        db_table = "tenant_settings"
        unique_together = (('business_unit_id', 'key'),)
