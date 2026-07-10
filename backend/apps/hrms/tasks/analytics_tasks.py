# yss_orbit/backend/apps/hrms/tasks/analytics_tasks.py
"""
Celery task: generate monthly HR analytics snapshot for all active BUs.
Scheduled via Celery Beat on the 1st of each month at 02:00 UTC.
"""
from __future__ import annotations

import logging

from celery import shared_task

logger = logging.getLogger(__name__)


@shared_task(
    bind=True,
    queue="queue_reports",
    max_retries=2,
    default_retry_delay=300,  # 5 minutes between retries
    acks_late=True,
    name="hrms.generate_analytics_snapshot",
)
def generate_analytics_snapshot_task(
    self,
    year: int,
    month: int,
    business_unit_id: str | None = None,
) -> dict:
    """
    Compute and persist monthly analytics snapshots.

    If business_unit_id is provided, computes only for that BU.
    Otherwise computes for all active BusinessUnits (Celery Beat scheduled run).

    Args:
        year: Calendar year (e.g. 2025).
        month: Calendar month (1–12).
        business_unit_id: Optional — restrict to a single BU.
    """
    from apps.organization.models import BusinessUnit
    from apps.hrms.services.analytics_snapshot_service import AnalyticsSnapshotService

    results = {}

    if business_unit_id:
        bu_ids = [business_unit_id]
    else:
        bu_ids = list(
            BusinessUnit.objects.filter(is_active=True).values_list("id", flat=True)
        )

    logger.info(
        "generate_analytics_snapshot_task: %d BUs, period=%04d-%02d",
        len(bu_ids), year, month,
    )

    for bu_id in bu_ids:
        try:
            snapshot = AnalyticsSnapshotService.compute_and_save(
                business_unit_id=bu_id,
                year=year,
                month=month,
            )
            results[str(bu_id)] = "OK"
            logger.info(
                "Snapshot OK: bu=%s headcount=%s",
                bu_id, snapshot.get("headcount", "?"),
            )
        except Exception as exc:
            results[str(bu_id)] = f"ERROR: {exc}"
            logger.error(
                "Snapshot FAILED: bu=%s error=%s", bu_id, exc, exc_info=True
            )

    return results
