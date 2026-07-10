# yss_orbit\backend\apps\recruitment\services\offer_letter_service.py
from django.db import transaction
from typing import Dict, Any

class OfferLetterService:
    @classmethod
    @transaction.atomic
    def create(cls, data: Dict[str, Any]):
        # Implementation for creating OfferLetter
        pass

    @classmethod
    @transaction.atomic
    def update(cls, instance_id, data: Dict[str, Any]):
        # Implementation for updating OfferLetter
        pass
