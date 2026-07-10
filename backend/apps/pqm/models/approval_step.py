# yss_orbit\backend\apps\pqm\models\approval_step.py
"""
PQMApprovalStep — individual approval/verification step for an NC.

Each NC has a defined set of approval steps based on its approval_levels_required.
Steps are created by ApprovalService when an NC moves into review or verification.
unique_together ensures one decision per (NC, stage, sequence_order) triplet.
"""
from __future__ import annotations

from django.db import models

from apps.platform.models.base import TenantModel
from apps.pqm.enums import ApprovalDecision, ApprovalStage


class PQMApprovalStep(TenantModel):
    """
    One approval/verification step within an NC's approval workflow.

    - stage: 'review' (Quality Review) or 'verification' (multi-level site verification)
    - sequence_order: 1, 2, 3... for multi-level verification
    - approver_id: UUID of the approver user
    - decision: PENDING → APPROVED / REJECTED / REWORK
    """

    organization_id = models.UUIDField(
        null=False,
        help_text="Denormalized from BU for tenant isolation.",
    )
    nc = models.ForeignKey(
        "pqm.NonConformance",
        on_delete=models.PROTECT,
        related_name="approval_steps",
    )
    stage = models.CharField(
        max_length=20,
        choices=ApprovalStage.choices,
        help_text="Review or Verification stage.",
    )
    sequence_order = models.PositiveSmallIntegerField(
        help_text="Order within stage: 1=first approver, 2=second, etc.",
    )
    approver_id = models.UUIDField(
        help_text="UUID of the approver for this step.",
    )
    decision = models.CharField(
        max_length=20,
        choices=ApprovalDecision.choices,
        default=ApprovalDecision.PENDING,
    )
    comments = models.TextField(blank=True, default="")
    decided_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text="Timestamp of decision. Null while PENDING.",
    )

    class Meta(TenantModel.Meta):
        db_table = "pqm_approval_step"
        unique_together = [("nc", "stage", "sequence_order")]
        ordering = ["nc", "stage", "sequence_order"]

    def __str__(self) -> str:
        return f"[{self.nc_id}] {self.stage} step {self.sequence_order}: {self.decision}"
