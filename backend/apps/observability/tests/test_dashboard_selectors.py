# yss_orbit\backend\apps\dashboard\tests\test_dashboard_selectors.py
import pytest
from apps.observability.selectors.dashboard_selectors import get_active_dashboards
from uuid import uuid4

@pytest.mark.django_db
def test_get_active_dashboards():
    dashboards = get_active_dashboards(business_unit_id=uuid4())
    assert len(dashboards) == 0
