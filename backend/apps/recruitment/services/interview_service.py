# yss_orbit\backend\apps\recruitment\services\interview_service.py
from django.db import transaction
from typing import Dict, Any

class InterviewService:
    @classmethod
    @transaction.atomic
    def create(cls, data: Dict[str, Any]):
        # Implementation for creating Interview
        pass

    @classmethod
    @transaction.atomic
    def update(cls, instance_id, data: Dict[str, Any]):
        # Implementation for updating Interview
        pass
