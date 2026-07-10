# yss_orbit/backend/apps/appraisal/repositories/review_cycle_repository.py
import uuid
from typing import Optional, Dict, Any
from django.db.models import QuerySet

from apps.appraisal.models import ReviewCycle

class ReviewCycleRepository:
    def get_by_id(self, cycle_id: uuid.UUID, business_unit_id: uuid.UUID) -> Optional[ReviewCycle]:
        return ReviewCycle.objects.filter(id=cycle_id, business_unit_id=business_unit_id).first()

    def get_all(self, business_unit_id: uuid.UUID) -> QuerySet[ReviewCycle]:
        return ReviewCycle.objects.filter(business_unit_id=business_unit_id)

    def create(self, business_unit_id: uuid.UUID, data: Dict[str, Any]) -> ReviewCycle:
        return ReviewCycle.objects.create(business_unit_id=business_unit_id, **data)

    def update(self, cycle: ReviewCycle, data: Dict[str, Any]) -> ReviewCycle:
        for key, value in data.items():
            setattr(cycle, key, value)
        cycle.save()
        return cycle

    def soft_delete(self, cycle: ReviewCycle, deleted_by_id: uuid.UUID) -> None:
        cycle.deleted_by_id = deleted_by_id
        cycle.delete()
