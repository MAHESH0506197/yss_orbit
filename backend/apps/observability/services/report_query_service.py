# yss_orbit\backend\apps\reporting\services\report_query_service.py
from django.db import transaction
from typing import Dict, Any

class ReportQueryService:
    @classmethod
    @transaction.atomic
    def create(cls, data: Dict[str, Any]):
        # Implementation for creating ReportQuery
        return True

    @classmethod
    @transaction.atomic
    def update(cls, instance_id, data: Dict[str, Any]):
        # Implementation for updating ReportQuery
        return True
