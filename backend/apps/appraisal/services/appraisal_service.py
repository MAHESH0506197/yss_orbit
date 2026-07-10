# yss_orbit/backend/apps/appraisal/services/appraisal_service.py
import logging
import uuid
from typing import Dict, Any

from django.db import transaction

from apps.platform.core_exceptions import ResourceNotFoundException
from apps.iam.security_context import SecurityContext
from apps.appraisal.models import Appraisal
from apps.appraisal.repositories.appraisal_repository import AppraisalRepository
from core.audit.audit_service import AuditService

logger = logging.getLogger(__name__)

class AppraisalService:
    def __init__(self):
        self.repository = AppraisalRepository()

    @transaction.atomic
    def create_appraisal(self, security_context: SecurityContext, data: Dict[str, Any]) -> Appraisal:
        bu_id = security_context.require_business_unit()
        
        data["created_by_id"] = security_context.effective_user_id
        data["updated_by_id"] = security_context.effective_user_id

        appraisal = self.repository.create(business_unit_id=bu_id, data=data)
        
        AuditService.record(
            action="CREATE",
            resource="appraisal.Appraisal",
            resource_id=str(appraisal.id),
            changes=data,
            status="SUCCESS"
        )
        return appraisal

    @transaction.atomic
    def update_appraisal(self, security_context: SecurityContext, appraisal_id: uuid.UUID, data: Dict[str, Any]) -> Appraisal:
        bu_id = security_context.require_business_unit()
        appraisal = self.repository.get_by_id(appraisal_id, bu_id)
        if not appraisal:
            raise ResourceNotFoundException("Appraisal not found")

        data["updated_by_id"] = security_context.effective_user_id
        appraisal = self.repository.update(appraisal, data)
        
        AuditService.record(
            action="UPDATE",
            resource="appraisal.Appraisal",
            resource_id=str(appraisal.id),
            changes=data,
            status="SUCCESS"
        )
        return appraisal

    @transaction.atomic
    def delete_appraisal(self, security_context: SecurityContext, appraisal_id: uuid.UUID) -> None:
        bu_id = security_context.require_business_unit()
        appraisal = self.repository.get_by_id(appraisal_id, bu_id)
        if not appraisal:
            raise ResourceNotFoundException("Appraisal not found")

        self.repository.soft_delete(appraisal, deleted_by_id=security_context.effective_user_id)
        
        AuditService.record(
            action="DELETE",
            resource="appraisal.Appraisal",
            resource_id=str(appraisal_id),
            changes={},
            status="SUCCESS"
        )
