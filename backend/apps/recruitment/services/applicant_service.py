# yss_orbit\backend\apps\recruitment\services\applicant_service.py
from django.db import transaction
from typing import Dict, Any

class ApplicantService:
    @classmethod
    @transaction.atomic
    def create(cls, data: Dict[str, Any]):
        # Implementation for creating Applicant
        pass

    @classmethod
    @transaction.atomic
    def update(cls, instance_id, data: Dict[str, Any]):
        # Implementation for updating Applicant
        pass
