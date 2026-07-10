# yss_orbit\backend\apps\dashboard\selectors\dashboard_selectors.py
from apps.observability.models import Dashboard

def get_default_dashboard(tenant_id):
    return Dashboard.objects.filter(tenant_id=tenant_id, is_default=True).first()

def get_active_dashboards(business_unit_id):
    """
    Returns active dashboards for a specific business unit.
    """
    return Dashboard.objects.filter(business_unit_id=business_unit_id, is_active=True)
