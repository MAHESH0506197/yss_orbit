# yss_orbit\backend\apps\pqm\models\site.py
"""
PQMSite — physical site/location within a project.
Sites are the direct parent of Non-Conformance records.
"""
from __future__ import annotations

from django.db import models

from apps.platform.models.base import TenantModel


class PQMSite(TenantModel):
    """A physical site or work location within a PQM Project."""

    organization_id = models.UUIDField(
        db_index=True,
        null=False,
        help_text="Denormalized from BU for fast tenant-isolation filtering.",
    )
    project = models.ForeignKey(
        "pqm.PQMProject",
        on_delete=models.PROTECT,
        related_name="sites",
    )
    name = models.CharField(max_length=255)
    code = models.CharField(max_length=30, blank=True, default="")
    location = models.CharField(max_length=255, blank=True, default="")
    address = models.TextField(blank=True, default="")
    is_active = models.BooleanField(default=True)

    class Meta(TenantModel.Meta):
        db_table = "pqm_site"
        unique_together = [("project", "code")]
        indexes = [
            models.Index(fields=["organization_id"]),
            models.Index(fields=["business_unit_id"]),
        ]

    def __str__(self) -> str:
        return f"{self.name} ({self.code})"
