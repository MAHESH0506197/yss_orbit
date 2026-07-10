# yss_orbit\backend\apps\tenant_settings\models\settings_template_model.py
from django.db import models
from apps.platform.models.base import TenantModel

class SettingsTemplateModel(TenantModel):
    name = models.CharField(max_length=255)
    is_active = models.BooleanField(default=True)
    metadata = models.JSONField(default=dict, blank=True)

    class Meta:
        db_table = 'tenant_settings_settings_template_model'
        verbose_name = 'SettingsTemplateModel'
        verbose_name_plural = 'SettingsTemplateModels'

    def __str__(self):
        return str(self.name)
