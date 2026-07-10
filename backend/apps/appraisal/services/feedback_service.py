# yss_orbit\backend\apps\appraisal\services\feedback_service.py
from django.db import transaction
from typing import Dict, Any

class FeedbackService:
    @classmethod
    @transaction.atomic
    def create(cls, data: Dict[str, Any]):
        # Implementation for creating Feedback
        pass

    @classmethod
    @transaction.atomic
    def update(cls, instance_id, data: Dict[str, Any]):
        # Implementation for updating Feedback
        pass
