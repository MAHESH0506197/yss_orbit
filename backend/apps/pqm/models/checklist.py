# yss_orbit\backend\apps\pqm\models\checklist.py
"""
PQMChecklist and PQMChecklistItem — inspection checklists referenced by NCs.
Checklists provide structured inspection criteria that NCs can reference.
"""
from __future__ import annotations

from django.db import models

from apps.platform.models.base import TenantModel


class PQMChecklist(TenantModel):
    """
    An inspection checklist used as a quality reference for NCs.
    Versioned: create a new version row rather than mutating an active checklist.
    """

    organization_id = models.UUIDField(
        null=False,
        help_text="Organization scope.",
    )
    name = models.CharField(max_length=255)
    category = models.ForeignKey(
        "pqm.PQMDropdownOption",
        null=True,
        blank=True,
        on_delete=models.PROTECT,
        related_name="checklists",
        help_text="Optional category link for this checklist.",
    )
    version = models.PositiveSmallIntegerField(
        default=1,
        help_text="Checklist version number. Increment on significant revision.",
    )
    is_active = models.BooleanField(default=True)

    class Meta(TenantModel.Meta):
        db_table = "pqm_checklist"
        ordering = ["name", "-version"]

    def __str__(self) -> str:
        return f"{self.name} v{self.version}"


class PQMChecklistItem(TenantModel):
    """
    A single line item within a PQMChecklist.
    Items are ordered by sequence_order within the checklist.
    """

    organization_id = models.UUIDField(
        null=False,
        help_text="Organization scope — must match parent checklist.",
    )
    checklist = models.ForeignKey(
        "pqm.PQMChecklist",
        on_delete=models.PROTECT,
        related_name="items",
    )
    sequence_order = models.PositiveSmallIntegerField(
        default=0,
        help_text="Display/evaluation order within checklist.",
    )
    item_text = models.TextField(
        help_text="The inspection criterion or check to perform.",
    )
    is_mandatory = models.BooleanField(
        default=True,
        help_text="If True, this item must be addressed before closure.",
    )

    class Meta(TenantModel.Meta):
        db_table = "pqm_checklist_item"
        ordering = ["checklist", "sequence_order"]

    def __str__(self) -> str:
        return f"[{self.checklist}] #{self.sequence_order}: {self.item_text[:60]}"
