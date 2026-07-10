# yss_orbit\backend\apps\pqm\models\saved_view.py
"""
PQMSavedView — user-saved filter/view configurations for the NC list.

Users can save their filter combinations as named views for quick access.
Views can be private (owner only) or shared with a specific role.
One view per user can be marked as default.
"""
from __future__ import annotations

from django.db import models

from apps.platform.models.base import TenantModel


class PQMSavedView(TenantModel):
    """
    A saved filter configuration for the NC list view.

    filter_json contains the serialized filter state (status, priority, site, etc.).
    is_shared_with_role_id: if set, all users with that role can see/use this view.
    is_default: if True, this view loads automatically for the owner.
    """

    organization_id = models.UUIDField(
        null=False,
        help_text="Organization scope for this saved view.",
    )
    owner_id = models.UUIDField(
        db_index=True,
        help_text="UUID of the user who created/owns this view.",
    )
    name = models.CharField(
        max_length=100,
        help_text="Display name for this saved view.",
    )
    filter_json = models.JSONField(
        default=dict,
        help_text="Serialized filter state for the NC list view.",
    )
    is_shared_with_role_id = models.UUIDField(
        null=True,
        blank=True,
        help_text="If set, users with this role UUID can access this view.",
    )
    is_default = models.BooleanField(
        default=False,
        help_text="If True, this view loads automatically for the owner.",
    )

    class Meta(TenantModel.Meta):
        db_table = "pqm_saved_view"
        unique_together = [("owner_id", "name")]
        ordering = ["name"]

    def __str__(self) -> str:
        shared = f" (shared with role {self.is_shared_with_role_id})" if self.is_shared_with_role_id else ""
        return f"SavedView '{self.name}' by {self.owner_id}{shared}"
