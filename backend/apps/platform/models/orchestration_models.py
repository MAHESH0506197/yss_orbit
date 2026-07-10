# yss_orbit\backend\apps\orchestration\models.py
import uuid
from django.db import models
from django.utils.translation import gettext_lazy as _

class SagaStatus(models.TextChoices):
    PENDING = "PENDING", _("Pending")
    IN_PROGRESS = "IN_PROGRESS", _("In Progress")
    COMPLETED = "COMPLETED", _("Completed")
    COMPENSATING = "COMPENSATING", _("Compensating")
    COMPENSATED = "COMPENSATED", _("Compensated")
    FAILED = "FAILED", _("Failed")

class SagaStepStatus(models.TextChoices):
    PENDING = "PENDING", _("Pending")
    COMPLETED = "COMPLETED", _("Completed")
    FAILED = "FAILED", _("Failed")
    COMPENSATED = "COMPENSATED", _("Compensated")
    SKIPPED = "SKIPPED", _("Skipped")

class Saga(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    saga_type = models.CharField(max_length=100, db_index=True)
    status = models.CharField(max_length=20, choices=SagaStatus.choices, default=SagaStatus.PENDING, db_index=True)
    payload = models.JSONField(default=dict, help_text=_("Initial data required to execute the saga"))
    correlation_id = models.CharField(max_length=100, db_index=True, blank=True, null=True)
    
    business_unit_id = models.UUIDField(db_index=True, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = "orchestration_saga"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.saga_type} ({self.id}) - {self.status}"


class SagaStep(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    saga = models.ForeignKey(Saga, on_delete=models.CASCADE, related_name="steps")
    step_name = models.CharField(max_length=100)
    step_order = models.PositiveSmallIntegerField()
    status = models.CharField(max_length=20, choices=SagaStepStatus.choices, default=SagaStepStatus.PENDING, db_index=True)
    error_message = models.TextField(blank=True, null=True)
    result_payload = models.JSONField(default=dict, blank=True, null=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "orchestration_saga_step"
        ordering = ["saga", "step_order"]
        unique_together = (("saga", "step_name"),)

    def __str__(self):
        return f"{self.saga.saga_type} - {self.step_name} [{self.status}]"
