# yss_orbit\backend\apps\events\models.py
"""
YSS Orbit — Event Outbox + Dead Letter Models
Implements the Transactional Outbox Pattern.
Domain events are written to outbox IN THE SAME TRANSACTION as the business operation.
The outbox worker (Celery) polls and delivers them asynchronously.
"""
from __future__ import annotations

import uuid
from typing import Any

from django.db import models
from django.utils import timezone


class EventStatus(models.TextChoices):
    PENDING = "PENDING", "Pending"
    PROCESSING = "PROCESSING", "Processing"
    DELIVERED = "DELIVERED", "Delivered"
    FAILED = "FAILED", "Failed"
    DEAD = "DEAD", "Dead (Max Retries Exceeded)"


class EventOutbox(models.Model):
    """
    Transactional outbox for domain events.

    CRITICAL: Events MUST be written inside the same transaction as the
    business operation (e.g., stock deduction + stock.low event in one atomic block).

    Outbox worker polls this table every 5 seconds with advisory locking.
    Partitioned by month for high-volume performance.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    # Event metadata (ALL events must carry these fields — E01)
    event_id = models.UUIDField(default=uuid.uuid4, unique=True, db_index=True)
    event_type = models.CharField(max_length=100, db_index=True)
    event_version = models.CharField(max_length=10, default="1.0")
    aggregate_type = models.CharField(max_length=100)  # e.g. "inventory.Item"
    aggregate_id = models.UUIDField(null=True, blank=True, db_index=True)

    # Tenant context (mandatory)
    business_unit_id = models.UUIDField(db_index=True)
    organization_id = models.UUIDField(null=True, blank=True)

    # Tracing
    correlation_id = models.CharField(max_length=36, db_index=True)
    causation_id = models.UUIDField(null=True, blank=True)  # Event that caused this

    # Payload
    payload = models.JSONField()

    # Delivery tracking
    status = models.CharField(
        max_length=20,
        choices=EventStatus.choices,
        default=EventStatus.PENDING,
        db_index=True,
    )
    retry_count = models.PositiveSmallIntegerField(default=0)
    max_retries = models.PositiveSmallIntegerField(default=5)
    next_retry_at = models.DateTimeField(null=True, blank=True, db_index=True)
    last_error = models.TextField(blank=True)
    locked_at = models.DateTimeField(null=True, blank=True)  # For advisory locking
    locked_by = models.CharField(max_length=100, blank=True)  # Worker ID

    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    delivered_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "event_outbox"
        ordering = ["created_at"]
        indexes = [
            models.Index(fields=["status", "next_retry_at"]),
            models.Index(fields=["business_unit_id", "event_type", "created_at"]),
            models.Index(fields=["aggregate_type", "aggregate_id"]),
        ]

    def schedule_retry(self, error: str) -> None:
        """Schedule next retry with exponential backoff."""
        import math
        self.retry_count += 1
        self.last_error = error[:2000]

        if self.retry_count >= self.max_retries:
            self.status = EventStatus.DEAD
            self.next_retry_at = None
        else:
            # Exponential backoff: 5s, 25s, 125s, 625s, 3125s
            delay_seconds = int(5 ** self.retry_count)
            self.next_retry_at = timezone.now() + timezone.timedelta(seconds=delay_seconds)
            self.status = EventStatus.PENDING

        self.locked_at = None
        self.locked_by = ""
        self.save(update_fields=[
            "retry_count", "last_error", "status",
            "next_retry_at", "locked_at", "locked_by",
        ])

    def mark_delivered(self) -> None:
        self.status = EventStatus.DELIVERED
        self.delivered_at = timezone.now()
        self.locked_at = None
        self.locked_by = ""
        self.save(update_fields=["status", "delivered_at", "locked_at", "locked_by"])


class EventDeadLetter(models.Model):
    """
    Dead letter queue for events that exceeded max retries.
    Monitored with CRITICAL alerts — operator must manually resolve.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    original_event_id = models.UUIDField(db_index=True)
    event_type = models.CharField(max_length=100, db_index=True)
    business_unit_id = models.UUIDField(db_index=True)
    correlation_id = models.CharField(max_length=36)
    payload = models.JSONField()
    failure_reason = models.TextField()
    retry_count = models.PositiveSmallIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    resolved = models.BooleanField(default=False, db_index=True)
    resolved_at = models.DateTimeField(null=True, blank=True)
    resolved_by_id = models.UUIDField(null=True, blank=True)
    resolution_notes = models.TextField(blank=True)

    class Meta:
        db_table = "event_dead_letter"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["resolved", "created_at"]),
            models.Index(fields=["event_type", "resolved"]),
        ]


class ProcessedEvent(models.Model):
    """
    Idempotency guard for event consumers.
    Before processing an event, consumer checks this table.
    If event_id exists → skip (already processed).
    If not → process → insert into this table atomically.

    Prevents duplicate processing on at-least-once delivery.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    event_id = models.UUIDField(db_index=True)
    event_type = models.CharField(max_length=100)
    consumer = models.CharField(max_length=200)  # e.g. "payroll.attendance_consumer"
    processed_at = models.DateTimeField(auto_now_add=True, db_index=True)
    business_unit_id = models.UUIDField(db_index=True)

    class Meta:
        db_table = "processed_events"
        ordering = ["-processed_at"]
        indexes = [
            models.Index(fields=["event_id", "consumer"]),
        ]
        constraints = [
            models.UniqueConstraint(
                fields=["event_id", "consumer"], 
                name="unique_processed_event_consumer"
            )
        ]
