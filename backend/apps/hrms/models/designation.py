# yss_orbit\backend\apps\hrms\models\designation.py
from django.db import models
from apps.platform.models.base import TenantModel


class Designation(TenantModel):
    """Job designation / title."""

    name = models.CharField(max_length=150)
    code = models.CharField(max_length=20, blank=True)
    department = models.ForeignKey(
        "hrms.Department",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="designations",
    )
    level = models.PositiveSmallIntegerField(default=0)  # Hierarchy level
    description = models.TextField(blank=True)

    class Meta(TenantModel.Meta):
        db_table = "hrms_designations"
        unique_together = [("business_unit_id", "name")]
