# DEPRECATED - DO NOT USE. Scheduled for removal. Use apps.hrms instead.
# yss_orbit/backend/apps/hrms_core/repositories/designation_repository.py
import uuid
from typing import Optional, Dict, Any
from django.db.models import QuerySet

from apps.hrms_core.models import Designation

class DesignationRepository:
    """
    Repository for Designation model handling CRUD operations.
    Enforces business_unit_id scoping for all reads and writes.
    """

    def get_by_id(self, designation_id: uuid.UUID, business_unit_id: uuid.UUID) -> Optional[Designation]:
        return Designation.objects.filter(id=designation_id, business_unit_id=business_unit_id).first()

    def get_all(self, business_unit_id: uuid.UUID) -> QuerySet[Designation]:
        return Designation.objects.filter(business_unit_id=business_unit_id)

    def create(self, business_unit_id: uuid.UUID, data: Dict[str, Any]) -> Designation:
        return Designation.objects.create(business_unit_id=business_unit_id, **data)

    def update(self, designation: Designation, data: Dict[str, Any]) -> Designation:
        for key, value in data.items():
            setattr(designation, key, value)
        designation.save()
        return designation

    def soft_delete(self, designation: Designation, deleted_by_id: uuid.UUID) -> None:
        designation.deleted_by_id = deleted_by_id
        designation.delete()
