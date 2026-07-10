# yss_orbit\backend\apps\hrms\models\department.py
from django.db import models
from apps.platform.models.base import TenantModel


class Department(TenantModel):
    """Department within a Business Unit."""

    name = models.CharField(max_length=150)
    code = models.CharField(max_length=20, blank=True)
    description = models.TextField(blank=True)
    parent = models.ForeignKey(
        "self",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="children",
    )
    level = models.PositiveIntegerField(default=0)
    path = models.CharField(max_length=255, blank=True)
    head_employee_id = models.UUIDField(null=True, blank=True)  # FK to Employee

    class Meta(TenantModel.Meta):
        db_table = "hrms_departments"
        unique_together = [("business_unit_id", "name")]
