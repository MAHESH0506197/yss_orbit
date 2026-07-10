# yss_orbit\backend\apps\appraisal\models\feedback_model.py
from django.db import models
from apps.platform.models.base import TenantModel

class Feedback(TenantModel):
    employee_id = models.UUIDField()
    reviewer_id = models.UUIDField()
    rating = models.DecimalField(max_digits=3, decimal_places=2, null=True, blank=True)
    comments = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'appraisal_feedback'
        verbose_name = 'Feedback'
        verbose_name_plural = 'Feedbacks'

    def __str__(self):
        return str(self.id)
