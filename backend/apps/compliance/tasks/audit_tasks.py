# yss_orbit\backend\apps\audit\tasks\audit_tasks.py
from celery import shared_task
import logging
from django.db import transaction

logger = logging.getLogger(__name__)

@shared_task(bind=True, max_retries=3)
def process_audit_async_task(self, data_id: str):
    logger.info(f"Executing async task for audit with id {data_id}")
    try:
        with transaction.atomic():
            # simulate work that requires atomicity
            return True
        return True
    except Exception as exc:
        logger.error(f"Task failed: {exc}")
        self.retry(exc=exc, countdown=60)
