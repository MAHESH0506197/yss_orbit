# yss_orbit\backend\apps\appraisal\models\kpi_model.py
from django.db import models
from apps.platform.models.base import TenantModel

class Kpi(TenantModel):
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'appraisal_kpi'
        verbose_name = 'Kpi'
        verbose_name_plural = 'Kpis'

    def __str__(self):
        return str(self.id)
