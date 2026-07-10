# yss_orbit\backend\apps\pqm\models\comment.py
"""
PQMComment — threaded comments on NC records.

Supports internal (staff-only) and external (client-visible) comments.
Threaded via parent FK — one level of nesting (reply to a comment).
is_internal=False is only effective when the project has external_comments_enabled.
"""
from __future__ import annotations

from django.db import models

from apps.platform.models.base import TenantModel


class PQMComment(TenantModel):
    """
    Comment on a NonConformance record.

    is_internal=True (default): visible to staff users only.
    is_internal=False: visible to External Client Auditors (when project toggle enabled).
    parent: non-null → this is a reply to parent comment.
    """

    organization_id = models.UUIDField(
        null=False,
        help_text="Denormalized from BU for tenant isolation.",
    )
    nc = models.ForeignKey(
        "pqm.NonConformance",
        on_delete=models.PROTECT,
        related_name="comments",
    )
    author_id = models.UUIDField(
        db_index=True,
        help_text="UUID of the user who wrote this comment.",
    )
    body = models.TextField()
    is_internal = models.BooleanField(
        default=True,
        help_text="True = staff-only. False = visible to External Client Auditor when project allows.",
    )
    parent = models.ForeignKey(
        "self",
        null=True,
        blank=True,
        on_delete=models.PROTECT,
        related_name="replies",
        help_text="Parent comment for threading. Null = top-level comment.",
    )

    class Meta(TenantModel.Meta):
        db_table = "pqm_comment"
        indexes = [
            models.Index(fields=["nc_id", "created_at"]),
        ]
        ordering = ["nc", "created_at"]

    def __str__(self) -> str:
        return f"[{self.nc_id}] Comment by {self.author_id}: {self.body[:60]}"
