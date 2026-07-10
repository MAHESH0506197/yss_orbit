# yss_orbit/backend/apps/appraisal/services/kpi_service.py
import logging
import uuid
from typing import Dict, Any

from django.db import transaction

from apps.platform.core_exceptions import ResourceNotFoundException
from apps.iam.security_context import SecurityContext
from apps.appraisal.models import KPI
from apps.appraisal.repositories.kpi_repository import KPIRepository
from core.audit.audit_service import AuditService

logger = logging.getLogger(__name__)

class KPIService:
    def __init__(self):
        self.repository = KPIRepository()

    @transaction.atomic
    def create_kpi(self, security_context: SecurityContext, data: Dict[str, Any]) -> KPI:
        bu_id = security_context.require_business_unit()
        
        data["created_by_id"] = security_context.effective_user_id
        data["updated_by_id"] = security_context.effective_user_id

        kpi = self.repository.create(business_unit_id=bu_id, data=data)
        
        AuditService.record(
            action="CREATE",
            resource="appraisal.KPI",
            resource_id=str(kpi.id),
            changes=data,
            status="SUCCESS"
        )
        return kpi

    @transaction.atomic
    def update_kpi(self, security_context: SecurityContext, kpi_id: uuid.UUID, data: Dict[str, Any]) -> KPI:
        bu_id = security_context.require_business_unit()
        kpi = self.repository.get_by_id(kpi_id, bu_id)
        if not kpi:
            raise ResourceNotFoundException("KPI not found")

        data["updated_by_id"] = security_context.effective_user_id
        kpi = self.repository.update(kpi, data)
        
        AuditService.record(
            action="UPDATE",
            resource="appraisal.KPI",
            resource_id=str(kpi.id),
            changes=data,
            status="SUCCESS"
        )
        return kpi

    @transaction.atomic
    def delete_kpi(self, security_context: SecurityContext, kpi_id: uuid.UUID) -> None:
        bu_id = security_context.require_business_unit()
        kpi = self.repository.get_by_id(kpi_id, bu_id)
        if not kpi:
            raise ResourceNotFoundException("KPI not found")

        self.repository.soft_delete(kpi, deleted_by_id=security_context.effective_user_id)
        
        AuditService.record(
            action="DELETE",
            resource="appraisal.KPI",
            resource_id=str(kpi_id),
            changes={},
            status="SUCCESS"
        )
