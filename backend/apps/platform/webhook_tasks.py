# yss_orbit\backend\apps\webhook\tasks.py
import uuid
import hmac
import hashlib
import json
import requests
from django.utils import timezone
from celery import shared_task
from celery.utils.log import get_task_logger

from apps.platform.webhook_repository import WebhookDeliveryRepository, WebhookEndpointRepository
from apps.platform.models import WebhookDelivery
from apps.platform.core_exceptions import AppException

logger = get_task_logger(__name__)

# Need to implement the Celery task with exponential backoff and dead-letter handling.
@shared_task(
    bind=True,
    queue="queue_notifications",
    max_retries=5,
    acks_late=True,
)
def send_webhook_task(self, delivery_id: uuid.UUID) -> None:
    """
    Celery task to send a webhook delivery.
    Implements 5 attempts exponential backoff and dead-letter handling.
    """
    delivery_repo = WebhookDeliveryRepository()
    endpoint_repo = WebhookEndpointRepository()

    # Get the delivery record
    try:
        delivery = delivery_repo.model_class.objects.get(id=delivery_id)
    except WebhookDelivery.DoesNotExist:
        logger.error(f"WebhookDelivery {delivery_id} not found.")
        return

    # Don't send if it's already success or dead letter
    if delivery.status in [WebhookDelivery.DeliveryStatus.SUCCESS, WebhookDelivery.DeliveryStatus.DEAD_LETTER]:
        return

    endpoint = delivery.endpoint

    # Mark as in-flight
    delivery.status = WebhookDelivery.DeliveryStatus.IN_FLIGHT
    delivery.attempt_count += 1
    delivery.save(update_fields=['status', 'attempt_count'])

    payload_json = json.dumps(delivery.payload, separators=(',', ':')).encode('utf-8')
    
    # Generate HMAC signature
    signature = hmac.new(
        key=endpoint.secret.encode('utf-8'),
        msg=payload_json,
        digestmod=hashlib.sha256
    ).hexdigest()

    headers = {
        'Content-Type': 'application/json',
        'X-YSSOrbit-Signature': f'sha256={signature}',
        'X-YSSOrbit-Event-Type': delivery.event_type,
        'X-YSSOrbit-Delivery': str(delivery.id),
        'X-Business-Unit-Id': str(delivery.business_unit_id),
    }

    start_time = timezone.now()
    success = False
    status_code = None
    response_body = ""
    error_message = ""

    try:
        # We use a short timeout as per endpoint configuration
        timeout = endpoint.timeout_seconds
        response = requests.post(endpoint.url, data=payload_json, headers=headers, timeout=timeout)
        
        status_code = response.status_code
        response_body = response.text[:2000] # store up to 2k chars
        
        if 200 <= status_code < 300:
            success = True
        else:
            error_message = f"HTTP Error: {status_code}"
    except requests.exceptions.RequestException as e:
        error_message = str(e)

    duration = timezone.now() - start_time
    duration_ms = int(duration.total_seconds() * 1000)

    # Update delivery record
    delivery.response_status_code = status_code
    delivery.response_body = response_body
    delivery.error_message = error_message
    delivery.duration_ms = duration_ms

    if success:
        delivery.status = WebhookDelivery.DeliveryStatus.SUCCESS
        delivery.delivered_at = timezone.now()
        delivery.save()
        
        # Update endpoint success tracking
        endpoint.last_success_at = timezone.now()
        endpoint.consecutive_failures = 0
        endpoint.save(update_fields=['last_success_at', 'consecutive_failures'])
    else:
        # Failure logic
        endpoint.last_failure_at = timezone.now()
        endpoint.consecutive_failures += 1
        
        # Suspend endpoint if too many consecutive failures (e.g., 100)
        if endpoint.consecutive_failures >= 100:
            endpoint.status = endpoint.Status.SUSPENDED
            
        endpoint.save(update_fields=['last_failure_at', 'consecutive_failures', 'status'])
        
        # Retry logic
        if self.request.retries < self.max_retries:
            delivery.status = WebhookDelivery.DeliveryStatus.PENDING
            # Exponential backoff: 2^retry * 10 seconds (e.g. 10s, 20s, 40s, 80s, 160s)
            retry_in = 10 * (2 ** self.request.retries)
            delivery.next_retry_at = timezone.now() + timezone.timedelta(seconds=retry_in)
            delivery.save()
            
            # Raise retry
            raise self.retry(exc=Exception(error_message), countdown=retry_in)
        else:
            # Dead letter
            delivery.status = WebhookDelivery.DeliveryStatus.DEAD_LETTER
            delivery.save()
            logger.critical(
                f"Webhook {delivery_id} failed after {self.max_retries} retries. "
                f"Event {delivery.event_type} for BU {delivery.business_unit_id}."
            )
            # Send alert to Slack/Sentry via separate dead letter handler or Sentry directly
