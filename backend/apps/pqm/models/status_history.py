# yss_orbit\backend\apps\pqm\models\status_history.py
"""
PQMStatusHistory — append-only audit log of NC status changes and events.

Immutable once written. Override save() to reject updates to existing rows.
This provides a complete, tamper-evident audit trail for every NC event.
"""
from __future__ import annotations

from typing import Any

from django.db import models

from apps.platform.models.base import TenantModel


class PQMStatusHistory(TenantModel):
    """
    Append-only event log for NonConformance lifecycle events.

    event_type examples: 'StatusChanged', 'Reassigned', 'ExtensionGranted',
    'Merged', 'Reopened', 'CommentAdded', 'AttachmentUploaded'.

    Attempting to update an existing row raises PermissionError.
    """

    organization_id = models.UUIDField(
        db_index=True,
        null=False,
        help_text="Denormalized from BU for tenant isolation.",
    )
    nc = models.ForeignKey(
        "pqm.NonConformance",
        on_delete=models.PROTECT,
        related_name="status_history",
    )
    event_type = models.CharField(
        max_length=50,
        help_text="Event type: StatusChanged, Reassigned, ExtensionGranted, Merged, Reopened, etc.",
    )
    from_status = models.CharField(
        max_length=30,
        blank=True,
        default="",
        help_text="Previous NC status (empty for non-status events).",
    )
    to_status = models.CharField(
        max_length=30,
        blank=True,
        default="",
        help_text="New NC status (empty for non-status events).",
    )
    actor_id = models.UUIDField(
        help_text="UUID of the user who caused this event.",
    )
    reason = models.TextField(
        blank=True,
        default="",
        help_text="Human-readable reason or note for this event.",
    )
    metadata = models.JSONField(
        default=dict,
        blank=True,
        help_text="Structured extra context for this event (e.g., merged_into NC id).",
    )

    class Meta(TenantModel.Meta):
        db_table = "pqm_status_history"
        indexes = [
            models.Index(fields=["nc_id", "created_at"]),
        ]
        ordering = ["nc", "created_at"]

    def save(self, *args: Any, **kwargs: Any) -> None:
        """Reject updates — status history is append-only."""
        if self.pk:
            # Check if this record already exists in the DB
            if PQMStatusHistory.all_objects.filter(pk=self.pk).exists():
                raise PermissionError(
                    "PQMStatusHistory records are immutable and cannot be updated. "
                    "Create a new record instead."
                )
        super().save(*args, **kwargs)

    def __str__(self) -> str:
        return f"[{self.nc_id}] {self.event_type} by {self.actor_id} at {self.created_at}"
