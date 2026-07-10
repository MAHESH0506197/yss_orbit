# yss_orbit\backend\apps\pqm\models\escalation_config.py
"""
PQMEscalationConfig — tenant SLA and escalation configuration per priority.

Configures:
- Base SLA in business days per priority
- Three escalation tiers: day offsets after target_closure_date
- Role names for each escalation tier's notification recipients
"""
from __future__ import annotations

from django.db import models

from apps.platform.models.base import TenantModel
from apps.pqm.enums import Priority


class PQMEscalationConfig(TenantModel):
    """
    SLA and escalation configuration scoped to (organization, business_unit, priority).

    One row per priority per BU. Created by admin via pqm.manage_config permission.
    EscalationService reads these rows during daily overdue checks.

    escalation_day_N: days after target_closure_date to trigger that escalation tier.
    escalation_N_recipient_role: role name string (data-driven, not hardcoded).
    """

    organization_id = models.UUIDField(
        db_index=True,
        null=False,
        help_text="Organization scope for this config.",
    )
    priority = models.CharField(
        max_length=20,
        choices=Priority.choices,
        help_text="NC priority this config applies to.",
    )
    sla_days = models.PositiveSmallIntegerField(
        help_text="Base SLA in business days for this priority.",
    )

    # ── Escalation Tier 1 ─────────────────────────────────────────────────────
    escalation_day_1 = models.PositiveSmallIntegerField(
        null=True,
        blank=True,
        help_text="Days after target_closure_date to trigger Tier-1 escalation.",
    )
    escalation_1_recipient_role = models.CharField(
        max_length=100,
        blank=True,
        default="",
        help_text="Role name for Tier-1 escalation recipients.",
    )

    # ── Escalation Tier 2 ─────────────────────────────────────────────────────
    escalation_day_2 = models.PositiveSmallIntegerField(
        null=True,
        blank=True,
        help_text="Days after target_closure_date to trigger Tier-2 escalation.",
    )
    escalation_2_recipient_role = models.CharField(
        max_length=100,
        blank=True,
        default="",
        help_text="Role name for Tier-2 escalation recipients.",
    )

    # ── Escalation Tier 3 ─────────────────────────────────────────────────────
    escalation_day_3 = models.PositiveSmallIntegerField(
        null=True,
        blank=True,
        help_text="Days after target_closure_date to trigger Tier-3 escalation.",
    )
    escalation_3_recipient_role = models.CharField(
        max_length=100,
        blank=True,
        default="",
        help_text="Role name for Tier-3 escalation recipients.",
    )

    class Meta(TenantModel.Meta):
        db_table = "pqm_escalation_config"
        unique_together = [("organization_id", "business_unit_id", "priority")]
        ordering = ["priority"]

    def __str__(self) -> str:
        return f"EscalationConfig [{self.priority}] SLA={self.sla_days}d (BU={self.business_unit_id})"
