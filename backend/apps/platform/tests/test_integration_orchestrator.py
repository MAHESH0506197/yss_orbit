# yss_orbit\backend\apps\integration\tests\test_integration_orchestrator.py
import pytest
import uuid
from apps.platform.orchestrators.integration_orchestrator import IntegrationOrchestrator
from apps.platform.models import Integration

pytestmark = pytest.mark.django_db

def test_sync_integration_data_success():
    bu_id = uuid.uuid4()
    integration = Integration.objects.create(
        business_unit_id=bu_id,
        name="Test Sync",
        provider="CUSTOM",
        is_active=True
    )
    result = IntegrationOrchestrator.sync_integration_data(integration.id, bu_id)
    assert result is True

def test_sync_integration_data_inactive():
    bu_id = uuid.uuid4()
    integration = Integration.objects.create(
        business_unit_id=bu_id,
        name="Test Sync",
        provider="CUSTOM",
        is_active=False
    )
    result = IntegrationOrchestrator.sync_integration_data(integration.id, bu_id)
    assert result is False

def test_sync_integration_data_not_found():
    result = IntegrationOrchestrator.sync_integration_data(uuid.uuid4(), uuid.uuid4())
    assert result is False
