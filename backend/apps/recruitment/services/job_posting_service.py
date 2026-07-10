# yss_orbit\backend\apps\recruitment\services\job_posting_service.py
from django.db import transaction
from typing import Dict, Any

class JobPostingService:
    @classmethod
    @transaction.atomic
    def create(cls, data: Dict[str, Any]):
        # Implementation for creating JobPosting
        pass

    @classmethod
    @transaction.atomic
    def update(cls, instance_id, data: Dict[str, Any]):
        # Implementation for updating JobPosting
        pass
