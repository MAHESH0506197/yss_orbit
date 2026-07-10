# yss_orbit\backend\apps\appraisal\models.py
from django.db import models
from django.conf import settings
from apps.platform.models.base import TenantModel
from apps.hrms.models.employee import Employee

class AppraisalCycle(TenantModel):
    name = models.CharField(max_length=255)
    start_date = models.DateField()
    end_date = models.DateField()
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return self.name

class KPI(TenantModel):
    cycle = models.ForeignKey(AppraisalCycle, on_delete=models.CASCADE, related_name='kpis')
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    weightage = models.DecimalField(max_digits=5, decimal_places=2, default=100.0)

    def __str__(self):
        return self.title

class EmployeeAppraisal(TenantModel):
    STATUS_CHOICES = [
        ('DRAFT', 'Draft'),
        ('SUBMITTED', 'Submitted'),
        ('REVIEWED', 'Reviewed'),
        ('CLOSED', 'Closed'),
    ]
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='appraisals')
    cycle = models.ForeignKey(AppraisalCycle, on_delete=models.CASCADE, related_name='employee_appraisals')
    manager = models.ForeignKey(Employee, on_delete=models.SET_NULL, null=True, related_name='managed_appraisals')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='DRAFT')
    self_rating = models.DecimalField(max_digits=4, decimal_places=2, null=True, blank=True)
    manager_rating = models.DecimalField(max_digits=4, decimal_places=2, null=True, blank=True)
    comments = models.TextField(blank=True)

    def __str__(self):
        return f"{self.employee} - {self.cycle.name}"
