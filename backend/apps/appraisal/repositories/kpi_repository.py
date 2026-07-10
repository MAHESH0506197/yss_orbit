# yss_orbit/backend/apps/appraisal/repositories/kpi_repository.py
import uuid
from typing import Optional, Dict, Any
from django.db.models import QuerySet

from apps.appraisal.models import KPI

class KPIRepository:
    def get_by_id(self, kpi_id: uuid.UUID, business_unit_id: uuid.UUID) -> Optional[KPI]:
        return KPI.objects.filter(id=kpi_id, business_unit_id=business_unit_id).first()

    def get_all(self, business_unit_id: uuid.UUID) -> QuerySet[KPI]:
        return KPI.objects.filter(business_unit_id=business_unit_id)

    def create(self, business_unit_id: uuid.UUID, data: Dict[str, Any]) -> KPI:
        return KPI.objects.create(business_unit_id=business_unit_id, **data)

    def update(self, kpi: KPI, data: Dict[str, Any]) -> KPI:
        for key, value in data.items():
            setattr(kpi, key, value)
        kpi.save()
        return kpi

    def soft_delete(self, kpi: KPI, deleted_by_id: uuid.UUID) -> None:
        kpi.deleted_by_id = deleted_by_id
        kpi.delete()
