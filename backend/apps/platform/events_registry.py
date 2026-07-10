# yss_orbit\backend\apps\events\registry.py
"""
YSS Orbit — Event Consumer Registry
Registers domain event consumers. Consumers are called by the outbox worker.
Each consumer MUST be idempotent (ProcessedEventGuard enforces this).
"""
from __future__ import annotations

import logging
import uuid
from typing import Any, Callable

from django.db import transaction

logger = logging.getLogger(__name__)

# Registry: event_type → list of consumer functions
_REGISTRY: dict[str, list[Callable[[dict[str, Any], str], None]]] = {}


def register_consumer(
    event_type: str,
    consumer: Callable[[dict[str, Any], str], None],
) -> None:
    """Register a consumer function for an event type."""
    if event_type not in _REGISTRY:
        _REGISTRY[event_type] = []
    _REGISTRY[event_type].append(consumer)
    logger.debug("Event consumer registered: %s → %s", event_type, consumer.__name__)


def get_consumer(event_type: str) -> Callable[[dict[str, Any], str], None] | None:
    """Get all consumers for an event type, wrapped in a single callable."""
    consumers = _REGISTRY.get(event_type, [])
    if not consumers:
        return None

    def _multi_consumer(payload: dict[str, Any], correlation_id: str) -> None:
        for consumer in consumers:
            consumer(payload, correlation_id)

    return _multi_consumer


class ProcessedEventGuard:
    """
    Idempotency guard for event consumers.

    Usage:
        with ProcessedEventGuard(event_id, event_type, consumer_name, business_unit_id):
            # process event
            # if already processed, this block is skipped

    Raises:
        AlreadyProcessedError: If event was already processed by this consumer.
    """

    def __init__(
        self,
        event_id: uuid.UUID | str,
        event_type: str,
        consumer_name: str,
        business_unit_id: uuid.UUID,
    ) -> None:
        self.event_id = str(event_id)
        self.event_type = event_type
        self.consumer_name = consumer_name
        self.business_unit_id = business_unit_id
        self._already_processed = False

    def __enter__(self) -> "ProcessedEventGuard":
        from apps.platform.models import ProcessedEvent

        exists = ProcessedEvent.objects.filter(
            event_id=self.event_id,
            consumer=self.consumer_name,
        ).exists()

        if exists:
            logger.info(
                "Skipping already-processed event",
                extra={
                    "event_id": self.event_id,
                    "event_type": self.event_type,
                    "consumer": self.consumer_name,
                },
            )
            self._already_processed = True

        return self

    def __exit__(self, exc_type: Any, exc_val: Any, exc_tb: Any) -> bool:
        if exc_type is not None:
            return False  # Let exception propagate

        if not self._already_processed:
            from apps.platform.models import ProcessedEvent
            ProcessedEvent.objects.create(
                event_id=self.event_id,
                event_type=self.event_type,
                consumer=self.consumer_name,
                business_unit_id=self.business_unit_id,
            )

        return False

    @property
    def already_processed(self) -> bool:
        return self._already_processed
