# yss_orbit\backend\apps\webhook\tasks\webhook_delivery_tasks.py
from celery import shared_task
import logging
from apps.platform.services.webhook_delivery_service import WebhookDeliveryService

logger = logging.getLogger(__name__)

@shared_task(bind=True, max_retries=3)
def deliver_webhook_task(self, data: dict):
    try:
        logger.info(f"Executing task deliver_webhook_task with data: {data}")
        service = WebhookDeliveryService()
        result = service.process(data)
        if result.get('status') == 'failed':
            raise Exception(result.get('error'))
        return True
    except Exception as exc:
        logger.error(f"Error in webhook delivery: {exc}")
        self.retry(exc=exc, countdown=60)
