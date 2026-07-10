# yss_orbit\backend\apps\pqm\models\contractor.py
"""
PQMContractor — contractor entity responsible for NC rectification.
Contractors are scoped to Business Unit and linked to NonConformance records.
"""
from __future__ import annotations

from django.db import models

from apps.platform.models.base import TenantModel


class PQMContractor(TenantModel):
    """
    A contractor company or entity that performs NC rectification work.
    Scoped to business unit so each BU maintains its own contractor list.
    """

    organization_id = models.UUIDField(
        null=False,
        help_text="Organization scope — shared across BUs within org.",
    )
    name = models.CharField(max_length=255)
    contact_person = models.CharField(max_length=255, blank=True, default="")
    contact_email = models.EmailField(blank=True, default="")
    contact_phone = models.CharField(max_length=30, blank=True, default="")
    is_active = models.BooleanField(default=True)

    class Meta(TenantModel.Meta):
        db_table = "pqm_contractor"
        unique_together = [("business_unit_id", "name")]
        ordering = ["name"]

    def __str__(self) -> str:
        return self.name
