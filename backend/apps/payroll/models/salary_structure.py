# yss_orbit\backend\apps\payroll\models\salary_structure.py
from django.db import models
from apps.platform.models.base import TenantModel

class SalaryStructure(TenantModel):
    name = models.CharField(max_length=255)
    is_default = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'payroll_salary_structure'
        verbose_name = 'SalaryStructure'
        verbose_name_plural = 'SalaryStructures'
        constraints = [
            models.UniqueConstraint(
                fields=["business_unit_id", "name"], 
                name="unique_salary_structure_name"
            )
        ]

    def __str__(self):
        return self.name
