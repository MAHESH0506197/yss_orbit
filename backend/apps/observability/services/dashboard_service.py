# yss_orbit\backend\apps\dashboard\services\dashboard_service.py
from uuid import UUID
from apps.observability.repositories.dashboard_repository import DashboardRepository

class DashboardService:
    def __init__(self):
        self.repo = DashboardRepository()

    def get_dashboard(self, dashboard_id: UUID):
        return self.repo.get_by_id(dashboard_id)

    def duplicate_dashboard(self, dashboard_id: UUID, new_name: str):
        # Logic to duplicate dashboard
        pass
