# yss_orbit\backend\apps\webhook\webhook_repository.py
import uuid
from typing import Any
from django.db.models import QuerySet

from apps.platform.repositories.base import BaseRepository
from apps.platform.models import WebhookEndpoint, WebhookDelivery


class WebhookEndpointRepository(BaseRepository[WebhookEndpoint]):
    def __init__(self) -> None:
        super().__init__(WebhookEndpoint)

    def get_active_endpoints_for_event(
        self, business_unit_id: uuid.UUID, event_type: str
    ) -> QuerySet[WebhookEndpoint]:
        """Fetch active endpoints subscribed to a specific event type."""
        return self.model_class.objects.filter(
            business_unit_id=business_unit_id,
            status=WebhookEndpoint.Status.ACTIVE,
            subscribed_events__contains=event_type,
        )


class WebhookDeliveryRepository(BaseRepository[WebhookDelivery]):
    def __init__(self) -> None:
        super().__init__(WebhookDelivery)
