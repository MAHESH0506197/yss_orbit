# yss_orbit\backend\apps\integration\tests\test_integration_model.py
import pytest
import uuid
from apps.platform.models import Integration, Webhook, WebhookDeliveryLog

pytestmark = pytest.mark.django_db

def test_integration_creation():
    bu_id = uuid.uuid4()
    integration = Integration.objects.create(
        business_unit_id=bu_id,
        name="Test Integration",
        provider="CUSTOM",
        credentials={"api_key": "123"},
        settings={"domain": "test.com"},
        is_active=True
    )
    assert integration.name == "Test Integration"
    assert integration.provider == "CUSTOM"
    assert integration.is_active is True
    assert str(integration) == "CUSTOM - Test Integration"

def test_webhook_creation():
    bu_id = uuid.uuid4()
    webhook = Webhook.objects.create(
        business_unit_id=bu_id,
        url="https://example.com/hook",
        events=["user.created"]
    )
    assert webhook.url == "https://example.com/hook"
    assert webhook.secret is not None
    assert str(webhook) == "Webhook(https://example.com/hook)"

def test_webhook_delivery_log_creation():
    bu_id = uuid.uuid4()
    webhook = Webhook.objects.create(
        business_unit_id=bu_id,
        url="https://example.com/hook",
        events=["user.created"]
    )
    log = WebhookDeliveryLog.objects.create(
        business_unit_id=bu_id,
        webhook_id=webhook.id,
        event_type="user.created",
        payload={"user_id": 1},
        success=True
    )
    assert log.event_type == "user.created"
    assert "Success: True" in str(log)
