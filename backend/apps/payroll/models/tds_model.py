# yss_orbit\backend\apps\payroll\models\tds_model.py
from django.db import models
from apps.platform.models.base import TenantModel

class TDSSlab(TenantModel):
    financial_year = models.CharField(max_length=20)
    min_income = models.DecimalField(max_digits=12, decimal_places=2)
    max_income = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    tax_rate = models.DecimalField(max_digits=5, decimal_places=2)
    surcharge_rate = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    cess_rate = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'payroll_tds_slabs'
        verbose_name = 'TDS Slab'
        verbose_name_plural = 'TDS Slabs'

    def __str__(self):
        return f"{self.financial_year} ({self.min_income} - {self.max_income})"
