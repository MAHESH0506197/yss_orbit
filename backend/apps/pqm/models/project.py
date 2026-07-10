# yss_orbit\backend\apps\pqm\models\project.py
"""
PQMProject — project entity within a Business Unit.

Project is the third level of the multi-tenant hierarchy:
  Organization → Business Unit → Project → Site → NC

Note: Project and Site models are introduced by PQM as the first module
that requires this granularity. If a future "Project Management" core module
is added, these can be migrated/superseded. Until then they are PQM-owned.
"""
from __future__ import annotations

from django.db import models

from apps.platform.models.base import TenantModel


class PQMProject(TenantModel):
    """A project within a Business Unit. Parent scope for Sites and NCs."""

    organization_id = models.UUIDField(
        db_index=True,
        null=False,
        help_text="Denormalized from BU for fast tenant-isolation filtering.",
    )
    name        = models.CharField(max_length=255)
    code        = models.CharField(max_length=30, blank=True, default="")
    description = models.TextField(blank=True, default="")
    location    = models.CharField(max_length=255, blank=True, default="")
    project_start_date = models.DateField(null=True, blank=True)
    expected_project_end_date = models.DateField(null=True, blank=True)
    capacity    = models.CharField(max_length=100, blank=True, default="")
    construction_incharge_id = models.UUIDField(null=True, blank=True)
    quality_incharge_id = models.UUIDField(null=True, blank=True)
    project_head_id = models.UUIDField(null=True, blank=True)
    quality_head_id = models.UUIDField(null=True, blank=True)
    is_active   = models.BooleanField(default=True)

    class Meta(TenantModel.Meta):
        db_table = "pqm_project"
        unique_together = [("business_unit_id", "code")]
        indexes = [
            models.Index(fields=["organization_id", "business_unit_id"]),
        ]

    def __str__(self) -> str:
        return f"{self.name} ({self.code})"
