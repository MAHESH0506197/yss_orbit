# yss_orbit\backend\apps\webhook\webhook_service.py
import secrets
import uuid
from typing import Any

from django.db import transaction
from django.db.models import QuerySet

from apps.platform.models import WebhookEndpoint, WebhookDelivery
from apps.platform.webhook_webhook_repository import WebhookEndpointRepository, WebhookDeliveryRepository


class WebhookService:
    """Business logic for Webhooks."""

    def __init__(self) -> None:
        self.endpoint_repo = WebhookEndpointRepository()
        self.delivery_repo = WebhookDeliveryRepository()

    def create_endpoint(
        self,
        business_unit_id: uuid.UUID,
        data: dict[str, Any],
        created_by_id: uuid.UUID | None = None,
    ) -> WebhookEndpoint:
        if 'secret' not in data or not data['secret']:
            data['secret'] = secrets.token_urlsafe(32)
            
        return self.endpoint_repo.create(
            business_unit_id=business_unit_id,
            data=data,
            created_by_id=created_by_id,
        )

    def get_endpoint(self, business_unit_id: uuid.UUID, endpoint_id: uuid.UUID) -> WebhookEndpoint:
        return self.endpoint_repo.get_by_id(
            record_id=endpoint_id,
            business_unit_id=business_unit_id,
        )

    def list_endpoints(
        self, business_unit_id: uuid.UUID, filters: dict[str, Any] | None = None
    ) -> QuerySet[WebhookEndpoint]:
        return self.endpoint_repo.list(
            business_unit_id=business_unit_id,
            filters=filters,
        )

    def update_endpoint(
        self,
        business_unit_id: uuid.UUID,
        endpoint_id: uuid.UUID,
        data: dict[str, Any],
        updated_by_id: uuid.UUID | None = None,
    ) -> WebhookEndpoint:
        instance = self.get_endpoint(business_unit_id, endpoint_id)
        return self.endpoint_repo.update(
            instance=instance,
            data=data,
            updated_by_id=updated_by_id,
        )

    def delete_endpoint(
        self,
        business_unit_id: uuid.UUID,
        endpoint_id: uuid.UUID,
        deleted_by_id: uuid.UUID | None = None,
    ) -> None:
        instance = self.get_endpoint(business_unit_id, endpoint_id)
        self.endpoint_repo.soft_delete(
            instance=instance,
            deleted_by_id=deleted_by_id,
        )

    def list_deliveries(
        self, business_unit_id: uuid.UUID, filters: dict[str, Any] | None = None
    ) -> QuerySet[WebhookDelivery]:
        return self.delivery_repo.list(
            business_unit_id=business_unit_id,
            filters=filters,
        )

    def get_delivery(self, business_unit_id: uuid.UUID, delivery_id: uuid.UUID) -> WebhookDelivery:
        return self.delivery_repo.get_by_id(
            record_id=delivery_id,
            business_unit_id=business_unit_id,
        )

    @transaction.atomic
    def trigger_webhook(
        self,
        business_unit_id: uuid.UUID,
        event_type: str,
        payload: dict[str, Any],
        event_id: uuid.UUID | None = None,
    ) -> list[WebhookDelivery]:
        """
        Triggers webhooks for a specific event type.
        Finds all active endpoints subscribed to the event and creates Delivery records.
        """
        if event_id is None:
            event_id = uuid.uuid4()

        endpoints = self.endpoint_repo.get_active_endpoints_for_event(
            business_unit_id=business_unit_id,
            event_type=event_type,
        )

        deliveries = []
        for endpoint in endpoints:
            delivery = self.delivery_repo.create(
                business_unit_id=business_unit_id,
                data={
                    "endpoint_id": endpoint.id,
                    "event_type": event_type,
                    "event_id": event_id,
                    "payload": payload,
                    "status": WebhookDelivery.DeliveryStatus.PENDING,
                },
            )
            deliveries.append(delivery)

            # Mock Celery task invocation
            # send_webhook_task.delay(delivery.id)
            self._dispatch_task(delivery.id)

        return deliveries

    def _dispatch_task(self, delivery_id: uuid.UUID) -> None:
        """Dispatch the webhook delivery task to Celery"""
        from apps.platform.core_tasks import send_webhook_task
        transaction.on_commit(lambda: send_webhook_task.delay(delivery_id))
