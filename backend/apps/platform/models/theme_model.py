# yss_orbit\backend\apps\branding\models\theme_model.py
from django.db import models
from apps.platform.models.base import TenantModel

class ThemeModel(TenantModel):
    name = models.CharField(max_length=255)
    is_active = models.BooleanField(default=True)
    metadata = models.JSONField(default=dict, blank=True)

    class Meta:
        db_table = 'branding_theme_model'
        verbose_name = 'ThemeModel'
        verbose_name_plural = 'ThemeModels'

    def __str__(self):
        return str(self.name)
