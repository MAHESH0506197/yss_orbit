# yss_orbit\backend\apps\dashboard\repositories\dashboard_repository.py
from uuid import UUID
from apps.observability.models import Dashboard, DashboardWidget

class DashboardRepository:
    def get_by_id(self, dashboard_id: UUID) -> Dashboard:
        return Dashboard.objects.get(id=dashboard_id)

    def list_for_tenant(self, tenant_id: UUID):
        return Dashboard.objects.filter(tenant_id=tenant_id)

    def create_widget(self, dashboard_id: UUID, **kwargs) -> DashboardWidget:
        return DashboardWidget.objects.create(dashboard_id=dashboard_id, **kwargs)
