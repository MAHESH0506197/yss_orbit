# yss_orbit\backend\apps\appraisal\models\review_cycle_model.py
from django.db import models
from apps.platform.models.base import TenantModel

class ReviewCycle(TenantModel):
    employee_id = models.UUIDField()
    reviewer_id = models.UUIDField()
    rating = models.DecimalField(max_digits=3, decimal_places=2, null=True, blank=True)
    comments = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'appraisal_review_cycle'
        verbose_name = 'ReviewCycle'
        verbose_name_plural = 'ReviewCycles'

    def __str__(self):
        return str(self.id)
