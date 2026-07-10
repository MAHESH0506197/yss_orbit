# yss_orbit\backend\apps\payroll\services\tds_service.py
from django.db import transaction
from typing import Dict, Any

class TdsService:
    @classmethod
    @transaction.atomic
    def create(cls, data: Dict[str, Any]):
        # Implementation for creating Tds
        pass

    @classmethod
    @transaction.atomic
    def update(cls, instance_id, data: Dict[str, Any]):
        # Implementation for updating Tds
        pass
