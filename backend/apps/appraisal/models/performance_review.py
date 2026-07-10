# yss_orbit\backend\apps\appraisal\models\performance_review.py
from django.db import models
from apps.platform.models.base import TenantModel
from apps.hrms.models import Employee

class PerformanceReview(TenantModel):
    STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('IN_PROGRESS', 'In Progress'),
        ('COMPLETED', 'Completed'),
    ]
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='performance_reviews')
    reviewer = models.ForeignKey(Employee, on_delete=models.SET_NULL, null=True, related_name='reviews_given')
    period_start = models.DateField()
    period_end = models.DateField()
    rating = models.DecimalField(max_digits=3, decimal_places=2, null=True, blank=True)
    comments = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')

    def __str__(self):
        return f"Review for {self.employee.employee_id}"
