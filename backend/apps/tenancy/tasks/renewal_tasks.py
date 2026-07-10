# yss_orbit\backend\apps\subscription\tasks\renewal_tasks.py
from celery import shared_task
import logging
from django.db import transaction

logger = logging.getLogger(__name__)

@shared_task(bind=True, max_retries=3)
def process_subscription_async_task(self, data_id: str):
    logger.info(f"Executing async task for subscription with id {data_id}")
    try:
        with transaction.atomic():
            # simulate work that requires atomicity
            return True
        return True
    except Exception as exc:
        logger.error(f"Task failed: {exc}")
        self.retry(exc=exc, countdown=60)
