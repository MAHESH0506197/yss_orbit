# yss_orbit\backend\apps\pqm\tasks.py
"""
PQM Celery tasks — scheduled via django-celery-beat.
All tasks are idempotent and log errors without raising.
"""
from __future__ import annotations

import logging

from celery import shared_task

logger = logging.getLogger(__name__)


@shared_task(name="pqm.check_overdue_ncs", bind=True, max_retries=3, default_retry_delay=300)
def check_overdue_ncs_task(self) -> dict:
    """
    Run daily (e.g. 08:00 org timezone).
    Checks all overdue NCs and fires tiered escalation notifications.
    """
    try:
        from apps.pqm.services.escalation_service import EscalationService
        count = EscalationService.check_overdue_ncs()
        logger.info("[PQM] check_overdue_ncs_task: processed %d NCs", count)
        return {"status": "ok", "processed": count}
    except Exception as exc:
        logger.error("[PQM] check_overdue_ncs_task failed: %s", exc, exc_info=True)
        raise self.retry(exc=exc)


@shared_task(name="pqm.check_due_approaching", bind=True, max_retries=3, default_retry_delay=300)
def check_due_approaching_task(self) -> dict:
    """
    Run daily. Sends T-1 day reminder to assigned engineers.
    """
    try:
        from apps.pqm.services.escalation_service import EscalationService
        count = EscalationService.check_due_approaching()
        logger.info("[PQM] check_due_approaching_task: sent %d reminders", count)
        return {"status": "ok", "reminders_sent": count}
    except Exception as exc:
        logger.error("[PQM] check_due_approaching_task failed: %s", exc, exc_info=True)
        raise self.retry(exc=exc)


@shared_task(name="pqm.invalidate_dashboard_cache")
def invalidate_dashboard_cache_task(organization_id: str) -> dict:
    """
    Invalidate Redis-cached dashboard KPIs for an org after any NC change.
    """
    try:
        from django.core.cache import cache
        cache_key = f"pqm:dashboard:kpi:{organization_id}"
        cache.delete(cache_key)
        logger.debug("[PQM] Dashboard cache invalidated for org %s", organization_id)
        return {"status": "ok", "cache_key": cache_key}
    except Exception as exc:
        logger.warning("[PQM] Dashboard cache invalidation failed: %s", exc)
        return {"status": "error", "reason": str(exc)}


@shared_task(name="pqm.send_escalation_digest")
def send_escalation_digest_task() -> dict:
    """
    Weekly digest of open/overdue NCs by project for managers.
    Placeholder — full implementation in Phase 2.
    """
    logger.info("[PQM] send_escalation_digest_task: placeholder (Phase 2)")
    return {"status": "noop"}
