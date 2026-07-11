# yss_orbit\backend\apps\pqm\models\non_conformance.py
"""
NonConformance — the core PQM domain entity.

Full lifecycle: Draft → Submitted → Under Review → Approved/Rejected →
Assigned → In Progress → Rectified → Verification Pending →
Approved for Closure → Closed  (or Reopened → Assigned)

NC numbers are assigned on first Submit via NumberingService.
All state transitions go through NCService.transition_status() — never direct writes.
"""
from __future__ import annotations

import django.contrib.postgres.indexes
from django.db import models
from django.utils import timezone

from apps.platform.models.base import TenantModel
from apps.pqm.enums import (
    ApprovalDecision,
    AttachmentStage,
    BackchargeStatus,
    NCStatus,
    NCSeries,
    Priority,
    ReferenceType,
    Severity,
)


class NonConformance(TenantModel):
    """
    Non-Conformance record — the central entity of the PQM module.

    Architecture notes:
    - nc_number is blank on creation; assigned atomically on first Submit.
    - All FK user references are UUIDField (not FK to User model).
    - linked_nc tracks recurring-issue families; merged_into_nc tracks merged NCs.
    - Backcharge fields are visible only to users with pqm.view_backcharge.
    - is_safety_critical overrides SLA to 24 hours regardless of priority.
    """

    # ── Tenant / Org ────────────────────────────────────────────────────────
    organization_id = models.UUIDField(
        db_index=True,
        null=False,
        help_text="Denormalized from BU for fast tenant-isolation filtering.",
    )

    # ── Identity ─────────────────────────────────────────────────────────────
    nc_number = models.CharField(
        max_length=50,
        unique=True,
        blank=True,
        default="",
        help_text="System-assigned NC number on Submit (e.g. NC-2025-L-00001). Blank while Draft.",
    )
    title = models.CharField(max_length=500)
    description = models.TextField()

    # ── Classification ────────────────────────────────────────────────────────
    status = models.CharField(
        max_length=30,
        choices=NCStatus.choices,
        default=NCStatus.DRAFT,
        db_index=True,
    )
    priority = models.ForeignKey(
        "pqm.PQMDropdownOption",
        null=True,
        blank=True,
        on_delete=models.PROTECT,
        related_name="nc_priorities",
    )
    severity = models.ForeignKey(
        "pqm.PQMDropdownOption",
        null=True,
        blank=True,
        on_delete=models.PROTECT,
        related_name="nc_severities",
    )
    is_safety_critical = models.BooleanField(
        default=False,
        db_index=True,
        help_text="Safety-critical NCs override SLA to 24h and trigger immediate escalation.",
    )

    # ── Scope / Location ─────────────────────────────────────────────────────
    project = models.ForeignKey(
        "pqm.PQMProject",
        on_delete=models.PROTECT,
        related_name="non_conformances",
    )
    category = models.ForeignKey(
        "pqm.PQMDropdownOption",
        null=True,
        blank=True,
        on_delete=models.PROTECT,
        related_name="nc_categories",
    )
    sub_category = models.ForeignKey(
        "pqm.PQMDropdownOption",
        null=True,
        blank=True,
        on_delete=models.PROTECT,
        related_name="nc_sub_categories",
    )
    contractor = models.ForeignKey(
        "pqm.PQMContractor",
        null=True,
        blank=True,
        on_delete=models.PROTECT,
        related_name="non_conformances",
    )
    location_description = models.ForeignKey(
        "pqm.PQMDropdownOption",
        null=True,
        blank=True,
        on_delete=models.PROTECT,
        related_name="nc_areas",
    )
    location_details = models.CharField(
        max_length=255,
        blank=True,
        default="",
        help_text="Specific location, e.g. Block D, Row 14",
    )
    block = models.CharField(
        max_length=100,
        blank=True,
        default="",
        help_text="e.g. Block D",
    )
    zone = models.CharField(
        max_length=100,
        blank=True,
        default="",
        help_text="e.g. Zone C",
    )

    reference_type = models.ForeignKey(
        "pqm.PQMDropdownOption",
        null=True,
        blank=True,
        on_delete=models.PROTECT,
        related_name="nc_reference_types",
    )
    reference_description = models.CharField(
        max_length=500,
        blank=True,
        default="",
        help_text="Details of the reference.",
    )
    drawing_reference = models.CharField(
        max_length=255,
        blank=True,
        default="",
        help_text="GA drawing / SLD number",
    )
    specification_reference = models.CharField(
        max_length=255,
        blank=True,
        default="",
        help_text="e.g. DBR-2024-Rev2",
    )
    standard_reference = models.CharField(
        max_length=255,
        blank=True,
        default="",
        help_text="e.g. IEC 62446-1, MNRE guideline ref",
    )

    # ── Checklist Reference ────────────────────────────────────────────────
    checklist_reference = models.ForeignKey(
        "pqm.PQMChecklist",
        null=True,
        blank=True,
        on_delete=models.PROTECT,
        related_name="non_conformances",
        help_text="Structured checklist reference (preferred).",
    )
    checklist_reference_text = models.CharField(
        max_length=255,
        blank=True,
        default="",
        help_text="Free-text checklist reference for legacy/offline data.",
    )

    # ── People ────────────────────────────────────────────────────────────────
    raised_by_id = models.UUIDField(
        db_index=True,
        help_text="UUID of the user who raised this NC.",
    )
    assigned_to_id = models.UUIDField(
        null=True,
        blank=True,
        db_index=True,
        help_text="UUID of the engineer assigned to rectify.",
    )
    site_incharge_id = models.UUIDField(
        null=True,
        blank=True,
        help_text="UUID of the Site Incharge for escalation.",
    )
    site_quality_incharge_id = models.UUIDField(
        null=True,
        blank=True,
        help_text="UUID of the Site Quality Incharge for escalation.",
    )
    project_incharge_id = models.UUIDField(
        null=True,
        blank=True,
        help_text="UUID of the Project Incharge for escalation.",
    )

    # ── Dates ─────────────────────────────────────────────────────────────────
    raised_date = models.DateField(
        default=timezone.now,
        help_text="Date the NC was raised.",
    )
    target_closure_date = models.DateField(
        null=True,
        blank=True,
        help_text="SLA-based target date for NC closure.",
    )
    original_target_closure_date = models.DateField(
        null=True,
        blank=True,
        help_text="Preserved original target date for audit trail when extensions granted.",
    )
    actual_closure_date = models.DateField(
        null=True,
        blank=True,
        help_text="Actual date the NC was closed.",
    )
    client_captured_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text="Offline-sync: timestamp when NC was captured on device.",
    )

    # ── Root Cause / Corrective Action ────────────────────────────────────────
    root_cause_description = models.TextField(blank=True, default="")
    root_cause_category = models.CharField(max_length=100, blank=True, default="")
    corrective_action = models.TextField(blank=True, default="")
    preventive_action = models.TextField(blank=True, default="")

    # ── Approval Tracking ─────────────────────────────────────────────────────
    current_approval_level = models.PositiveSmallIntegerField(
        default=0,
        help_text="Current verification level reached (0 = not started).",
    )
    approval_levels_required = models.PositiveSmallIntegerField(
        default=3,
        help_text="Total verification levels required before closure.",
    )
    reopen_count = models.PositiveSmallIntegerField(
        default=0,
        help_text="Number of times this NC has been reopened.",
    )

    # ── Backcharge ────────────────────────────────────────────────────────────
    backcharge_amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="Backcharge amount billed to contractor. Visible only to authorized roles.",
    )
    backcharge_status = models.CharField(
        max_length=30,
        choices=BackchargeStatus.choices,
        default=BackchargeStatus.NOT_APPLICABLE,
    )

    # ── Relationships ─────────────────────────────────────────────────────────
    linked_nc = models.ForeignKey(
        "self",
        null=True,
        blank=True,
        on_delete=models.PROTECT,
        related_name="linked_ncs",
        help_text="Links to a recurring-issue family head NC.",
    )
    merged_into_nc = models.ForeignKey(
        "self",
        null=True,
        blank=True,
        on_delete=models.PROTECT,
        related_name="merged_ncs",
        help_text="Target NC this was merged into. Set on MERGED transition.",
    )

    # ── Migration / Legacy ────────────────────────────────────────────────────
    is_migrated = models.BooleanField(
        default=False,
        help_text="True if imported from legacy Excel/system.",
    )
    legacy_reference = models.CharField(
        max_length=100,
        blank=True,
        default="",
        help_text="Original reference from legacy system.",
    )
    series = models.CharField(
        max_length=10,
        choices=NCSeries.choices,
        default=NCSeries.LIVE,
        help_text="LIVE for production NCs, LEGACY for imported records.",
    )

    class Meta(TenantModel.Meta):
        db_table = "pqm_non_conformance"
        indexes = [
            models.Index(fields=["organization_id", "status"]),
            models.Index(fields=["business_unit_id", "status"]),
            models.Index(fields=["assigned_to_id", "status"]),
            models.Index(fields=["is_safety_critical", "status"]),
            models.Index(fields=["project_id", "status"]),
            django.contrib.postgres.indexes.GinIndex(fields=["title", "description"], name="pqm_nc_title_desc_gin", opclasses=["gin_trgm_ops", "gin_trgm_ops"]),
        ]
        constraints = [
            models.CheckConstraint(
                check=(
                    models.Q(target_closure_date__isnull=True) |
                    models.Q(target_closure_date__gte=models.F("raised_date"))
                ),
                name="pqm_nc_target_closure_gte_raised",
            ),
            models.CheckConstraint(
                check=(
                    models.Q(actual_closure_date__isnull=True) |
                    models.Q(actual_closure_date__gte=models.F("raised_date"))
                ),
                name="pqm_nc_actual_closure_gte_raised",
            ),
            models.CheckConstraint(
                check=models.Q(current_approval_level__gte=0),
                name="pqm_nc_approval_level_non_negative",
            ),
            models.CheckConstraint(
                check=models.Q(status__in=[s for s, _ in NCStatus.choices]),
                name="pqm_nc_valid_status",
            ),
        ]

    def __str__(self) -> str:
        return f"{self.nc_number or '(Draft)'} — {self.title[:60]}"

    @property
    def is_overdue(self) -> bool:
        """True if NC has a target date and today is past it and not closed."""
        from django.utils import timezone
        if self.status in NCStatus.terminal_states():
            return False
        if not self.target_closure_date:
            return False
        return timezone.now().date() > self.target_closure_date

    @property
    def days_overdue(self) -> int:
        """Number of calendar days past target closure date. 0 if not overdue."""
        from django.utils import timezone
        if not self.is_overdue:
            return 0
        return (timezone.now().date() - self.target_closure_date).days
