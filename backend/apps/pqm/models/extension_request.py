# yss_orbit\backend\apps\pqm\models\extension_request.py
"""
PQMExtensionRequest — formal request to extend an NC's target closure date.

Engineers request extensions with a reason; Quality Heads approve/reject.
An approved extension updates the NC's target_closure_date and preserves
original_target_closure_date for audit.
"""
from __future__ import annotations

from django.db import models

from apps.platform.models.base import TenantModel
from apps.pqm.enums import ApprovalDecision


class PQMExtensionRequest(TenantModel):
    """
    Extension request for a NonConformance's target closure date.

    Lifecycle: PENDING → APPROVED (NC target updated) / REJECTED (NC unchanged).
    Multiple requests per NC are permitted; decision is per-request.
    """

    organization_id = models.UUIDField(
        null=False,
        help_text="Denormalized from BU for tenant isolation.",
    )
    nc = models.ForeignKey(
        "pqm.NonConformance",
        on_delete=models.PROTECT,
        related_name="extension_requests",
    )
    requested_by_id = models.UUIDField(
        help_text="UUID of the user requesting the extension.",
    )
    original_target_date = models.DateField(
        help_text="NC's target_closure_date at time of this request.",
    )
    requested_date = models.DateField(
        help_text="New proposed target_closure_date.",
    )
    reason = models.TextField(
        help_text="Justification for the extension request.",
    )
    decision = models.CharField(
        max_length=20,
        choices=ApprovalDecision.choices,
        default=ApprovalDecision.PENDING,
    )
    decided_by_id = models.UUIDField(
        null=True,
        blank=True,
        help_text="UUID of the approver who decided on this request.",
    )
    decided_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text="Timestamp of decision.",
    )
    decision_comments = models.TextField(
        blank=True,
        default="",
        help_text="Optional comments from the approver.",
    )

    class Meta(TenantModel.Meta):
        db_table = "pqm_extension_request"
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return (
            f"ExtensionRequest [{self.nc_id}] "
            f"{self.original_target_date} → {self.requested_date}: {self.decision}"
        )
