# yss_orbit\backend\apps\integration\tasks\integration_tasks.py
import logging
import uuid
from typing import Dict, Any
from celery import shared_task

from apps.platform.models import Webhook
from apps.platform.services.webhook_delivery_service import WebhookDeliveryService
from apps.platform.orchestrators.integration_orchestrator import IntegrationOrchestrator

logger = logging.getLogger(__name__)

@shared_task(bind=True, max_retries=3)
def sync_integration_task(self, integration_id: str, business_unit_id: str):
    """
    Background task to synchronize data for an integration.
    """
    try:
        int_id = uuid.UUID(integration_id)
        bu_id = uuid.UUID(business_unit_id)
        result = IntegrationOrchestrator.sync_integration_data(int_id, bu_id)
        if not result:
            logger.warning(f"Sync failed for integration {integration_id}")
        return result
    except Exception as exc:
        logger.error(f"Error in sync_integration_task: {exc}")
        self.retry(exc=exc, countdown=60)

@shared_task(bind=True, max_retries=5)
def dispatch_webhook_task(self, webhook_id: str, event_type: str, payload: Dict[str, Any]):
    """
    Background task to deliver a webhook payload asynchronously.
    """
    try:
        wh_id = uuid.UUID(webhook_id)
        webhook = Webhook.objects.get(id=wh_id)
        WebhookDeliveryService.send_webhook(webhook, event_type, payload)
    except Webhook.DoesNotExist:
        logger.error(f"Webhook {webhook_id} not found for dispatch.")
    except Exception as exc:
        logger.error(f"Error in dispatch_webhook_task: {exc}")
        self.retry(exc=exc, countdown=2 ** self.request.retries * 60)
