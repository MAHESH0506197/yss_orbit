# yss_orbit\backend\apps\reporting\services\report_export_service.py
from django.db import transaction
from typing import Dict, Any

class ReportExportService:
    @classmethod
    @transaction.atomic
    def create(cls, data: Dict[str, Any]):
        # Implementation for creating ReportExport
        return True

    @classmethod
    @transaction.atomic
    def update(cls, instance_id, data: Dict[str, Any]):
        # Implementation for updating ReportExport
        return True
