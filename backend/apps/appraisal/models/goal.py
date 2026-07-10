# yss_orbit\backend\apps\appraisal\models\goal.py
from django.db import models
from apps.platform.models.base import TenantModel
from apps.hrms.models import Employee

class Goal(TenantModel):
    STATUS_CHOICES = [
        ('NOT_STARTED', 'Not Started'),
        ('IN_PROGRESS', 'In Progress'),
        ('ACHIEVED', 'Achieved'),
        ('MISSED', 'Missed'),
    ]
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='goals')
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    due_date = models.DateField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='NOT_STARTED')

    def __str__(self):
        return self.title
