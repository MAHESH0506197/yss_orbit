# yss_orbit\backend\apps\dashboard\orchestrators\dashboard_orchestrator.py
from uuid import UUID
from apps.observability.services.dashboard_service import DashboardService

class DashboardOrchestrator:
    def __init__(self):
        self.service = DashboardService()

    def get_dashboard_summary(self, dashboard_id: UUID):
        dashboard = self.service.get_dashboard(dashboard_id)
        return {
            "id": dashboard.id,
            "name": dashboard.name,
            "widget_count": dashboard.widgets.count(),
        }
