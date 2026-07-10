# yss_orbit\backend\apps\appraisal\models\appraisal_model.py
from django.db import models
from apps.platform.models.base import TenantModel
from .review_cycle_model import ReviewCycle

class Appraisal(TenantModel):
    class AppraisalStatus(models.TextChoices):
        PENDING_SELF = "PENDING_SELF", "Pending Self Review"
        PENDING_MANAGER = "PENDING_MANAGER", "Pending Manager Review"
        COMPLETED = "COMPLETED", "Completed"
        ACKNOWLEDGED = "ACKNOWLEDGED", "Employee Acknowledged"

    cycle = models.ForeignKey(ReviewCycle, on_delete=models.CASCADE, related_name="appraisals", null=True, blank=True)
    employee_id = models.UUIDField(db_index=True)
    manager_id = models.UUIDField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=AppraisalStatus.choices, default=AppraisalStatus.PENDING_SELF, db_index=True)

    # Scores
    self_rating = models.DecimalField(max_digits=4, decimal_places=2, null=True, blank=True)
    manager_rating = models.DecimalField(max_digits=4, decimal_places=2, null=True, blank=True)
    final_rating = models.DecimalField(max_digits=4, decimal_places=2, null=True, blank=True)

    # KPI scores
    kpi_scores = models.JSONField(default=dict)  # {kpi_id: {self_score, manager_score, final_score}}

    # Comments
    self_achievements = models.TextField(blank=True)
    self_improvements = models.TextField(blank=True)
    self_goals_next_period = models.TextField(blank=True)
    manager_strengths = models.TextField(blank=True)
    manager_areas_of_improvement = models.TextField(blank=True)
    manager_goals = models.TextField(blank=True)
    overall_comments = models.TextField(blank=True)

    # Dates
    self_submitted_at = models.DateTimeField(null=True, blank=True)
    manager_submitted_at = models.DateTimeField(null=True, blank=True)
    acknowledged_at = models.DateTimeField(null=True, blank=True)

    # Outcome
    promotion_recommended = models.BooleanField(null=True, blank=True)
    increment_recommended = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)  # %

    class Meta:
        db_table = 'appraisal_appraisal'
        verbose_name = 'Appraisal'
        verbose_name_plural = 'Appraisals'
        unique_together = [("cycle", "employee_id")]
        ordering = ["-created_at"]

    def __str__(self):
        return str(self.id)
