# yss_orbit\backend\apps\payroll\models\payroll_run_model.py
from django.db import models
from apps.platform.models.base import TenantModel
import uuid

class PayrollRun(TenantModel):
    class Status(models.TextChoices):
        DRAFT      = 'DRAFT',      'Draft'
        PROCESSING = 'PROCESSING', 'Processing'
        PROCESSED  = 'PROCESSED',  'Processed'
        FAILED     = 'FAILED',     'Failed'
        APPROVED   = 'APPROVED',   'Approved'
        LOCKED     = 'LOCKED',     'Locked'     # Finance locked — no edits
        ARCHIVED   = 'ARCHIVED',   'Archived'   # 7+ years — read-only

    # Immutable statuses — payroll run cannot be re-generated
    IMMUTABLE_STATUSES = {Status.LOCKED, Status.ARCHIVED}
    # Statuses that allow rollback to PROCESSED
    ROLLBACK_ELIGIBLE_STATUSES = {Status.APPROVED}

    month = models.IntegerField(default=1)
    year = models.IntegerField(default=2024)
    status = models.CharField(max_length=50, choices=Status.choices, default=Status.DRAFT)
    total_gross = models.DecimalField(max_digits=15, decimal_places=2, default=0.00)
    total_net = models.DecimalField(max_digits=15, decimal_places=2, default=0.00)
    total_deductions = models.DecimalField(max_digits=15, decimal_places=2, default=0.00)
    total_employees = models.IntegerField(default=0)
    run_by_id = models.UUIDField(null=True, blank=True)
    # Approval workflow fields
    approved_by_id = models.UUIDField(null=True, blank=True)   # HR Manager
    approved_at = models.DateTimeField(null=True, blank=True)
    locked_by_id = models.UUIDField(null=True, blank=True)     # Finance Manager
    locked_at = models.DateTimeField(null=True, blank=True)
    archived_at = models.DateTimeField(null=True, blank=True)
    correlation_id = models.CharField(max_length=36, default=uuid.uuid4)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'payroll_runs'
        verbose_name = 'PayrollRun'
        verbose_name_plural = 'PayrollRuns'
        constraints = [
            models.UniqueConstraint(
                fields=["business_unit_id", "month", "year"], 
                name="unique_payroll_run_per_month"
            )
        ]

    def __str__(self):
        return str(self.id)
