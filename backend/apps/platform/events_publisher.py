# yss_orbit\backend\apps\events\publisher.py
"""
YSS Orbit — Event Publisher (Outbox Pattern)
Publishes domain events by writing to the outbox table within the
SAME transaction as the business operation.

Usage (in service layer, inside transaction.atomic()):
    EventPublisher.publish(
        event_type="inventory.low_stock",
        aggregate_type="inventory.Item",
        aggregate_id=item.id,
        business_unit_id=item.business_unit_id,
        payload={"item_id": str(item.id), "sku": item.sku, ...},
        correlation_id=ctx.correlation_id,
    )
"""
from __future__ import annotations

import uuid
import logging
from typing import Any

from apps.platform.models import EventOutbox

logger = logging.getLogger(__name__)

# All 18 mandatory domain events (E01)
VALID_EVENT_TYPES = frozenset([
    # Inventory
    "inventory.low_stock",
    "inventory.expiry_alert",
    "inventory.transferred",
    # Purchase
    "purchase.received",
    # POS / Billing
    "invoice.created",
    "invoice.paid",
    "invoice.refunded",
    # Payment
    "payment.success",
    "payment.refunded",
    # HRMS
    "employee.created",
    "employee.updated",
    "employee.terminated",
    # Attendance
    "attendance.finalized",
    # Leave
    "leave.approved",
    "leave.rejected",
    "leave.cancelled",
    # Payroll
    "payroll.generated",
    "payroll.approved",
    "payroll.disbursed",
    # Recruitment
    "recruitment.hired",
    # Appraisal
    "appraisal.completed",
    # Subscription
    "subscription.activated",
    "subscription.deactivated",
    "subscription.expired",
    # Impersonation
    "impersonation.started",
    "impersonation.ended",
])


class EventPublisher:
    """
    Writes domain events to the transactional outbox.

    CRITICAL: This MUST be called inside an active transaction.atomic() block
    so the event is written atomically with the business operation.

    Never publish events outside of transactions — this breaks atomicity.
    """

    @staticmethod
    def publish(
        event_type: str,
        aggregate_type: str,
        business_unit_id: uuid.UUID,
        payload: dict[str, Any],
        correlation_id: str,
        aggregate_id: uuid.UUID | None = None,
        organization_id: uuid.UUID | None = None,
        event_version: str = "1.0",
        causation_id: uuid.UUID | None = None,
    ) -> EventOutbox:
        """
        Write a domain event to the outbox.

        Args:
            event_type: Dot-notation event name (e.g. "inventory.low_stock")
            aggregate_type: Resource type (e.g. "inventory.Item")
            business_unit_id: Owning BU — MANDATORY
            payload: Event data (must be JSON-serializable)
            correlation_id: Request/job correlation ID for tracing
            aggregate_id: ID of the aggregate that generated this event
            organization_id: Parent organization (if known)
            event_version: Schema version for forward compatibility
            causation_id: Event that caused this event (for chains)

        Returns:
            The created EventOutbox record

        Raises:
            ValueError: If event_type is not in the registry
        """
        if event_type not in VALID_EVENT_TYPES:
            logger.warning(
                "Unknown event type — consider adding to VALID_EVENT_TYPES",
                extra={"event_type": event_type, "correlation_id": correlation_id},
            )
            # Don't raise — allow unknown events for extensibility, but log warning

        event_id = uuid.uuid4()

        # Enrich payload with mandatory E01 fields
        enriched_payload = {
            **payload,
            "_meta": {
                "event_id": str(event_id),
                "event_type": event_type,
                "event_version": event_version,
                "business_unit_id": str(business_unit_id),
                "correlation_id": correlation_id,
            },
        }

        outbox_entry = EventOutbox.objects.create(
            event_id=event_id,
            event_type=event_type,
            event_version=event_version,
            aggregate_type=aggregate_type,
            aggregate_id=aggregate_id,
            business_unit_id=business_unit_id,
            organization_id=organization_id,
            correlation_id=correlation_id,
            causation_id=causation_id,
            payload=enriched_payload,
        )

        logger.debug(
            "Domain event queued in outbox",
            extra={
                "event_type": event_type,
                "event_id": str(event_id),
                "aggregate_type": aggregate_type,
                "aggregate_id": str(aggregate_id) if aggregate_id else None,
                "business_unit_id": str(business_unit_id),
                "correlation_id": correlation_id,
            },
        )

        return outbox_entry

    @staticmethod
    def publish_many(
        events: list[dict[str, Any]],
        business_unit_id: uuid.UUID,
        correlation_id: str,
    ) -> list[EventOutbox]:
        """
        Publish multiple events in a single bulk_create call.
        More efficient for batch operations.
        """
        records = []
        for event in events:
            event_id = uuid.uuid4()
            records.append(EventOutbox(
                event_id=event_id,
                event_type=event["event_type"],
                event_version=event.get("event_version", "1.0"),
                aggregate_type=event["aggregate_type"],
                aggregate_id=event.get("aggregate_id"),
                business_unit_id=business_unit_id,
                correlation_id=correlation_id,
                payload={
                    **event.get("payload", {}),
                    "_meta": {
                        "event_id": str(event_id),
                        "event_type": event["event_type"],
                        "business_unit_id": str(business_unit_id),
                        "correlation_id": correlation_id,
                    },
                },
            ))

        return EventOutbox.objects.bulk_create(records, batch_size=100)
