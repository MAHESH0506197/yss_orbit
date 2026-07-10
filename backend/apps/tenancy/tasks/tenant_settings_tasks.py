# yss_orbit\backend\apps\tenant_settings\tasks\tenant_settings_tasks.py
from celery import shared_task
import logging
from django.db import transaction

logger = logging.getLogger(__name__)

@shared_task(bind=True, max_retries=3)
def process_tenant_settings_async_task(self, data_id: str):
    logger.info(f"Executing async task for tenant_settings with id {data_id}")
    try:
        with transaction.atomic():
            # simulate work that requires atomicity
            pass
        return True
    except Exception as exc:
        logger.error(f"Task failed: {exc}")
        self.retry(exc=exc, countdown=60)
