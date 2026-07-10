# yss_orbit\backend\apps\dashboard\tests\test_dashboard_events.py
import pytest
from apps.observability.events.events import DashboardCreatedEvent
from uuid import uuid4

def test_dashboard_created_event():
    event = DashboardCreatedEvent(dashboard_id=uuid4(), tenant_id=uuid4())
    assert event.dashboard_id is not None
