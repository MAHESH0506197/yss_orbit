# yss_orbit\backend\apps\reporting\models.py
from django.db import models
from apps.platform.models.base import TenantModel

class ReportTemplate(TenantModel):
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    # The source model or query configuration
    data_source = models.CharField(max_length=100, help_text="Module/Model to fetch data from")
    query_config = models.JSONField(default=dict, help_text="JSON configuration for filters, aggregations, columns")
    is_scheduled = models.BooleanField(default=False)
    cron_expression = models.CharField(max_length=100, blank=True, null=True, help_text="Cron expression if scheduled")

    class Meta(TenantModel.Meta):
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return self.name

class ReportExecution(TenantModel):
    class Status(models.TextChoices):
        PENDING = "PENDING", "Pending"
        RUNNING = "RUNNING", "Running"
        COMPLETED = "COMPLETED", "Completed"
        FAILED = "FAILED", "Failed"

    template = models.ForeignKey(ReportTemplate, on_delete=models.CASCADE, related_name="executions")
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    
    # Execution details
    started_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    
    error_message = models.TextField(blank=True, null=True)
    
    # Store result or link to file
    result_url = models.URLField(max_length=1024, blank=True, null=True, help_text="URL to download the report CSV/PDF")
    row_count = models.IntegerField(default=0)

    class Meta(TenantModel.Meta):
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return f"{self.template.name} - {self.status}"
