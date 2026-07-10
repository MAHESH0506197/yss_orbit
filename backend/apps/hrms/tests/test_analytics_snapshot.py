# yss_orbit/backend/apps/hrms/tests/test_analytics_snapshot.py
"""
Tests for AnalyticsSnapshotService and HRAnalyticsSnapshot persistence.

Verifies:
  - compute_and_save() returns a structured dict with all expected keys
  - Data is persisted to HRAnalyticsSnapshot (upsert behaviour)
  - Calling twice for the same period overwrites, not duplicates
  - _attend_metrics field name (attendance_date) is correct
  - _leave_metrics uses StatusChoices (not Status)
  - Empty BU returns sensible zero-defaults, not exceptions
"""
from __future__ import annotations

import uuid
from datetime import date

import pytest

from apps.hrms.models.analytics_snapshot import HRAnalyticsSnapshot
from apps.hrms.services.analytics_snapshot_service import AnalyticsSnapshotService


EXPECTED_KEYS = {
    "business_unit_id",
    "year",
    "month",
    "computed_at",
    "headcount",
    "new_hires",
    "exits",
    "attrition_rate_pct",
    "gender_split",
    "attendance_total_days",
    "attendance_present_days",
    "attendance_lop_days",
    "attendance_pct",
    "total_leave_days",
    "leave_breakdown",
    "payroll_run_status",
    "payroll_total_gross",
    "payroll_total_net",
    "training_completions",
    "headcount_by_department",
}


@pytest.mark.django_db
class TestAnalyticsSnapshotService:

    def test_compute_returns_all_keys(self, tenant_bu):
        """compute_and_save() must return all required analytics keys."""
        data = AnalyticsSnapshotService.compute_and_save(
            business_unit_id=tenant_bu.id,
            year=2025,
            month=4,
        )
        missing = EXPECTED_KEYS - set(data.keys())
        assert not missing, f"Missing keys in snapshot: {missing}"

    def test_snapshot_persisted_to_db(self, tenant_bu):
        """After compute_and_save(), a HRAnalyticsSnapshot row must exist in the DB."""
        AnalyticsSnapshotService.compute_and_save(
            business_unit_id=tenant_bu.id,
            year=2025,
            month=5,
        )
        snap = HRAnalyticsSnapshot.objects.get(
            business_unit_id=tenant_bu.id,
            year=2025,
            month=5,
        )
        assert snap is not None
        assert "headcount" in snap.data
        assert snap.computed_at is not None

    def test_idempotent_upsert(self, tenant_bu):
        """Calling compute_and_save twice for same period must not create duplicates."""
        AnalyticsSnapshotService.compute_and_save(
            business_unit_id=tenant_bu.id,
            year=2025,
            month=6,
        )
        AnalyticsSnapshotService.compute_and_save(
            business_unit_id=tenant_bu.id,
            year=2025,
            month=6,
        )
        count = HRAnalyticsSnapshot.objects.filter(
            business_unit_id=tenant_bu.id,
            year=2025,
            month=6,
        ).count()
        assert count == 1, f"Expected 1 snapshot, got {count}"

    def test_empty_bu_no_exceptions(self, tenant_bu):
        """Empty BusinessUnit (no employees, no attendance) must return 0-defaults, not crash."""
        data = AnalyticsSnapshotService.compute_and_save(
            business_unit_id=tenant_bu.id,
            year=2024,
            month=1,
        )
        assert data["headcount"] == 0
        assert data["attendance_pct"] == 0.0
        assert data["total_leave_days"] == 0
        assert data["payroll_run_status"] == "NOT_RUN"

    def test_different_bus_isolated(self, tenant_bu, tenant_org, db):
        """Snapshots for different BUs must be stored independently."""
        from apps.organization.models.business_unit_model import BusinessUnit

        bu2 = BusinessUnit.objects.create(
            organization=tenant_org,
            name="BU Two",
            code=f"BU2{uuid.uuid4().hex[:4].upper()}",
            is_active=True,
        )

        AnalyticsSnapshotService.compute_and_save(
            business_unit_id=tenant_bu.id,
            year=2025,
            month=7,
        )
        AnalyticsSnapshotService.compute_and_save(
            business_unit_id=bu2.id,
            year=2025,
            month=7,
        )

        assert HRAnalyticsSnapshot.objects.filter(business_unit_id=tenant_bu.id, year=2025, month=7).count() == 1
        assert HRAnalyticsSnapshot.objects.filter(business_unit_id=bu2.id, year=2025, month=7).count() == 1
        # Cross-BU check: each BU's snapshot is separate
        assert HRAnalyticsSnapshot.objects.filter(year=2025, month=7).count() == 2

