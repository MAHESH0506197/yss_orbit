# yss_orbit\backend\apps\integration\tests\test_integration_service.py
import pytest
import uuid
from apps.platform.services import IntegrationService, WebhookService

pytestmark = pytest.mark.django_db

def test_create_integration():
    bu_id = uuid.uuid4()
    user_id = uuid.uuid4()
    integration = IntegrationService.create_integration(
        business_unit_id=bu_id,
        user_id=user_id,
        name="HubSpot Sync",
        provider="HUBSPOT",
        credentials={"token": "abc"},
        settings={}
    )
    assert integration.id is not None
    assert integration.name == "HubSpot Sync"
    assert integration.provider == "HUBSPOT"

def test_update_integration():
    bu_id = uuid.uuid4()
    user_id = uuid.uuid4()
    integration = IntegrationService.create_integration(
        business_unit_id=bu_id,
        user_id=user_id,
        name="Salesforce",
        provider="SALESFORCE",
        credentials={}
    )
    updated = IntegrationService.update_integration(
        integration_id=integration.id,
        business_unit_id=bu_id,
        user_id=user_id,
        name="Salesforce v2"
    )
    assert updated is not None
    assert updated.name == "Salesforce v2"

def test_create_webhook():
    bu_id = uuid.uuid4()
    user_id = uuid.uuid4()
    webhook = WebhookService.register_webhook(
        business_unit_id=bu_id,
        user_id=user_id,
        url="https://test.com/hook",
        events=["*"]
    )
    assert webhook.id is not None
    assert webhook.url == "https://test.com/hook"
