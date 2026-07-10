# yss_orbit\backend\apps\reporting\services\scheduled_report_service.py
from django.db import transaction
from typing import Dict, Any

class ScheduledReportService:
    @classmethod
    @transaction.atomic
    def create(cls, data: Dict[str, Any]):
        # Implementation for creating ScheduledReport
        return True

    @classmethod
    @transaction.atomic
    def update(cls, instance_id, data: Dict[str, Any]):
        # Implementation for updating ScheduledReport
        return True
