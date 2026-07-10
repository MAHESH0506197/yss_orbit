# yss_orbit\backend\apps\dashboard\services\dashboard_widget_service.py
from django.db import transaction
from typing import Dict, Any

class DashboardWidgetService:
    @classmethod
    @transaction.atomic
    def create(cls, data: Dict[str, Any]):
        # Implementation for creating DashboardWidget
        return True

    @classmethod
    @transaction.atomic
    def update(cls, instance_id, data: Dict[str, Any]):
        # Implementation for updating DashboardWidget
        return True
