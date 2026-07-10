# yss_orbit\backend\apps\events\tasks.py
"""
YSS Orbit — Outbox Worker Task
Polls the event_outbox table every 5 seconds with advisory locking.
Delivers events to registered consumers. Moves failed events to dead letter.
"""
from __future__ import annotations

import logging
import socket
import uuid
from typing import Any

from celery import shared_task
from django.db import transaction

logger = logging.getLogger(__name__)

WORKER_ID = f"{socket.gethostname()}-{uuid.uuid4().hex[:8]}"
BATCH_SIZE = 10  # Events per polling cycle
LOCK_TIMEOUT_SECONDS = 60  # Events locked longer than this are released


@shared_task(
    name="apps.platform.core_tasks.process_outbox",
    queue="queue_outbox",
    max_retries=0,  # The task itself doesn't retry — it handles retries internally
    soft_time_limit=55,
    time_limit=60,
    acks_late=True,
)
def process_outbox() -> dict[str, int]:
    """
    Outbox worker — polls for pending events and delivers them.
    Uses SELECT FOR UPDATE SKIP LOCKED for concurrent-safe processing.
    Uses advisory lock to prevent duplicate workers processing same event.

    Returns: {"processed": N, "failed": N, "dead": N}
    """
    from django.utils import timezone
    from django.db.models import Q
    from apps.platform.models import EventOutbox, EventStatus, EventDeadLetter
    from apps.platform.registry import get_consumer

    stats = {"processed": 0, "failed": 0, "dead": 0}

    # Release stale locks first (events locked > 60s by crashed workers)
    EventOutbox.objects.filter(
        status=EventStatus.PROCESSING,
        locked_at__lt=timezone.now() - timezone.timedelta(seconds=LOCK_TIMEOUT_SECONDS),
    ).update(
        status=EventStatus.PENDING,
        locked_at=None,
        locked_by="",
    )

    # Fetch next batch of pending events
    with transaction.atomic():
        pending_events = (
            EventOutbox.objects
            .select_for_update(skip_locked=True)
            .filter(
                Q(next_retry_at__isnull=True) | Q(next_retry_at__lte=timezone.now()),
                status=EventStatus.PENDING,
            )
            .order_by("created_at")[:BATCH_SIZE]
        )

        event_ids = list(pending_events.values_list("id", flat=True))

        if not event_ids:
            return stats

        # Lock the events
        EventOutbox.objects.filter(id__in=event_ids).update(
            status=EventStatus.PROCESSING,
            locked_at=timezone.now(),
            locked_by=WORKER_ID,
        )

    # Process each event outside the lock transaction
    for event in EventOutbox.objects.filter(id__in=event_ids):
        try:
            consumer_fn = get_consumer(event.event_type)
            if consumer_fn:
                consumer_fn(event.payload, event.correlation_id)

            event.mark_delivered()
            stats["processed"] += 1

            logger.info(
                "Event delivered",
                extra={
                    "event_type": event.event_type,
                    "event_id": str(event.event_id),
                    "correlation_id": event.correlation_id,
                },
            )

        except Exception as exc:
            error_msg = f"{type(exc).__name__}: {exc}"
            logger.error(
                "Event delivery failed",
                extra={
                    "event_type": event.event_type,
                    "event_id": str(event.event_id),
                    "error": error_msg,
                    "retry_count": event.retry_count,
                    "correlation_id": event.correlation_id,
                },
                exc_info=True,
            )

            event.schedule_retry(error_msg)

            if event.status == "DEAD":
                # Move to dead letter
                EventDeadLetter.objects.create(
                    original_event_id=event.event_id,
                    event_type=event.event_type,
                    business_unit_id=event.business_unit_id,
                    correlation_id=event.correlation_id,
                    payload=event.payload,
                    failure_reason=error_msg,
                    retry_count=event.retry_count,
                )
                stats["dead"] += 1

                # Sentry alert for dead letter events
                try:
                    import sentry_sdk
                    sentry_sdk.capture_message(
                        f"CRITICAL: Event moved to dead letter: {event.event_type}",
                        level="error",
                        extras={"event_id": str(event.event_id)},
                    )
                except Exception:
                    pass
            else:
                stats["failed"] += 1

    return stats
