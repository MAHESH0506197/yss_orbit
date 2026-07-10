# yss_orbit/backend/apps/appraisal/repositories/appraisal_repository.py
import uuid
from typing import Optional, Dict, Any
from django.db.models import QuerySet

from apps.appraisal.models import Appraisal

class AppraisalRepository:
    def get_by_id(self, appraisal_id: uuid.UUID, business_unit_id: uuid.UUID) -> Optional[Appraisal]:
        return Appraisal.objects.filter(id=appraisal_id, business_unit_id=business_unit_id).first()

    def get_all(self, business_unit_id: uuid.UUID) -> QuerySet[Appraisal]:
        return Appraisal.objects.filter(business_unit_id=business_unit_id)

    def create(self, business_unit_id: uuid.UUID, data: Dict[str, Any]) -> Appraisal:
        return Appraisal.objects.create(business_unit_id=business_unit_id, **data)

    def update(self, appraisal: Appraisal, data: Dict[str, Any]) -> Appraisal:
        for key, value in data.items():
            setattr(appraisal, key, value)
        appraisal.save()
        return appraisal

    def soft_delete(self, appraisal: Appraisal, deleted_by_id: uuid.UUID) -> None:
        appraisal.deleted_by_id = deleted_by_id
        appraisal.delete()
