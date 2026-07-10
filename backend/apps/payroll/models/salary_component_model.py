# yss_orbit\backend\apps\payroll\models\salary_component_model.py
from django.db import models
from apps.platform.models.base import TenantModel

class SalaryComponent(TenantModel):
    name = models.CharField(max_length=255)
    code = models.CharField(max_length=50, db_index=True)
    component_type = models.CharField(max_length=50, default='EARNING')
    calculation_type = models.CharField(max_length=50, default='FLAT')
    value = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    is_taxable = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'payroll_salary_component'
        verbose_name = 'SalaryComponent'
        verbose_name_plural = 'SalaryComponents'
        constraints = [
            models.UniqueConstraint(
                fields=["business_unit_id", "code"], 
                name="unique_salary_component_code"
            )
        ]

    def __str__(self):
        return self.name

class SalaryStructureComponent(TenantModel):
    structure = models.ForeignKey('SalaryStructure', on_delete=models.CASCADE, related_name='components')
    component = models.ForeignKey(SalaryComponent, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'payroll_salary_structure_components'
