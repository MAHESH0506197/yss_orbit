# yss_orbit/backend/apps/notifications/tasks.py
"""
Celery tasks for the notifications app.
"""
from __future__ import annotations

import logging
import uuid

from celery import shared_task

logger = logging.getLogger(__name__)


@shared_task(
    bind=True,
    queue="queue_notifications",
    max_retries=3,
    default_retry_delay=60,  # 60 seconds between retries
    acks_late=True,
)
def dispatch_notification_task(
    self,
    business_unit_id: str,
    event_type: str,
    recipient_user_id: str,
    context: dict,
    correlation_id: str,
) -> None:
    """
    Async wrapper for NotificationService.dispatch().
    Called by NotificationService.dispatch_async() to offload channel
    dispatch from the main request/response cycle.

    Retries up to 3 times on transient failures (e.g. SMTP timeouts).
    """
    from apps.platform.services import NotificationService

    try:
        NotificationService.dispatch(
            business_unit_id=uuid.UUID(business_unit_id),
            event_type=event_type,
            recipient_user_id=uuid.UUID(recipient_user_id),
            context=context,
            correlation_id=correlation_id,
        )
    except Exception as exc:
        logger.error(
            "dispatch_notification_task failed: %s (attempt %d/%d)",
            exc, self.request.retries + 1, self.max_retries + 1,
            exc_info=True,
        )
        raise self.retry(exc=exc)
