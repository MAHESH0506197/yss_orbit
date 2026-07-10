# yss_orbit/backend/apps/hrms/models/analytics_snapshot.py
"""
YSS Orbit — HRAnalyticsSnapshot Model
======================================
Stores monthly point-in-time analytics snapshots per BusinessUnit.
Computed by AnalyticsSnapshotService and persisted for fast dashboard reads.

Design:
  - Unique per (business_unit_id, year, month)
  - data: JSONField — full snapshot dict (headcount, payroll totals, etc.)
  - computed_at: timestamp of last computation
  - Fully tenant-scoped via TenantModel
"""
from __future__ import annotations

from django.db import models

from apps.platform.models.base import TenantModel


class HRAnalyticsSnapshot(TenantModel):
    """
    Persisted monthly analytics snapshot for a BusinessUnit.
    Written by AnalyticsSnapshotService.compute_and_save().
    Read by AnalyticsSnapshotView for dashboard display.
    """

    MONTH_CHOICES = [(i, i) for i in range(1, 13)]

    year = models.PositiveIntegerField(
        db_index=True,
        help_text="Calendar year (e.g. 2025).",
    )
    month = models.PositiveSmallIntegerField(
        choices=MONTH_CHOICES,
        db_index=True,
        help_text="Calendar month (1–12).",
    )
    data = models.JSONField(
        default=dict,
        help_text="Full snapshot data dict: workforce, attendance, leave, payroll, training metrics.",
    )
    computed_at = models.DateTimeField(
        help_text="Timestamp when this snapshot was last computed.",
    )

    class Meta(TenantModel.Meta):
        app_label = "hrms"
        verbose_name = "HR Analytics Snapshot"
        verbose_name_plural = "HR Analytics Snapshots"
        unique_together = ("business_unit_id", "year", "month")
        indexes = [
            models.Index(fields=["business_unit_id", "year", "month"]),
        ]

    def __str__(self) -> str:
        return f"HRAnalyticsSnapshot(bu={self.business_unit_id}, {self.year}-{self.month:02d})"
