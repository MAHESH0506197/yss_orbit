# yss_orbit\backend\apps\dashboard\services.py
import uuid
from typing import Dict, Any, List, Optional
from .models import Dashboard, DashboardWidget
from django.db.models import QuerySet

class DashboardService:
    def get_dashboards(self, bu_id: uuid.UUID) -> QuerySet[Dashboard]:
        return Dashboard.objects.filter(business_unit_id=bu_id)

    def get_default_dashboard(self, bu_id: uuid.UUID) -> Optional[Dashboard]:
        return Dashboard.objects.filter(business_unit_id=bu_id, is_default=True).first()

    def get_dashboard_by_id(self, bu_id: uuid.UUID, dashboard_id: uuid.UUID) -> Optional[Dashboard]:
        return Dashboard.objects.filter(business_unit_id=bu_id, id=dashboard_id).first()

    def create_dashboard(self, bu_id: uuid.UUID, data: Dict[str, Any], created_by_id: uuid.UUID) -> Dashboard:
        data["business_unit_id"] = bu_id
        data["created_by_id"] = created_by_id
        
        # If this is the first dashboard or marked as default, handle defaults
        if data.get("is_default") or not Dashboard.objects.filter(business_unit_id=bu_id).exists():
            Dashboard.objects.filter(business_unit_id=bu_id).update(is_default=False)
            data["is_default"] = True
            
        return Dashboard.objects.create(**data)

    def add_widget(self, bu_id: uuid.UUID, dashboard_id: uuid.UUID, data: Dict[str, Any], created_by_id: uuid.UUID) -> Optional[DashboardWidget]:
        dashboard = self.get_dashboard_by_id(bu_id, dashboard_id)
        if not dashboard:
            return None
            
        data["business_unit_id"] = bu_id
        data["dashboard"] = dashboard
        data["created_by_id"] = created_by_id
        
        return DashboardWidget.objects.create(**data)

    def fetch_widget_data(self, bu_id: uuid.UUID, widget: DashboardWidget) -> Dict[str, Any]:
        """
        In a real application, this would route to an analytical engine or specialized service.
        For demonstration, we mock some KPI responses based on metric_name.
        """
        metric_name = widget.metric_name.lower()
        if widget.widget_type == DashboardWidget.WidgetType.KPI:
            return {"value": 12450.0, "unit": "USD", "trend": "+5.2%"}
        elif widget.widget_type == DashboardWidget.WidgetType.LINE_CHART:
            return {
                "labels": ["Jan", "Feb", "Mar", "Apr", "May"],
                "datasets": [{"label": metric_name, "data": [10, 20, 15, 30, 25]}]
            }
        return {"data": "mock_data"}
