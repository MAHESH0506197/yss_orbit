# yss_orbit/backend/apps/organization/tasks/organization_tasks.py
from celery import shared_task
import logging

logger = logging.getLogger(__name__)


@shared_task(name="organization.daily_health_report", bind=True, max_retries=3)
def daily_org_health_report(self):
    from apps.organization.models import Organization
    try:
        total = Organization.objects.filter(is_deleted=False).count()
        active = Organization.objects.filter(is_active=True, is_deleted=False).count()
        deleted = Organization.objects.filter(is_deleted=True).count()
        logger.info("Org health: total=%d active=%d deleted=%d", total, active, deleted)
    except Exception as exc:
        logger.exception("daily_org_health_report failed")
        raise self.retry(exc=exc, countdown=60)

