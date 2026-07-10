# yss_orbit/backend/apps/appraisal/services/review_cycle_service.py
import logging
import uuid
from typing import Dict, Any

from django.db import transaction

from apps.platform.core_exceptions import ResourceNotFoundException
from apps.iam.security_context import SecurityContext
from apps.appraisal.models import ReviewCycle
from apps.appraisal.repositories.review_cycle_repository import ReviewCycleRepository
from core.audit.audit_service import AuditService

logger = logging.getLogger(__name__)

class ReviewCycleService:
    def __init__(self):
        self.repository = ReviewCycleRepository()

    @transaction.atomic
    def create_cycle(self, security_context: SecurityContext, data: Dict[str, Any]) -> ReviewCycle:
        bu_id = security_context.require_business_unit()
        
        data["created_by_id"] = security_context.effective_user_id
        data["updated_by_id"] = security_context.effective_user_id

        cycle = self.repository.create(business_unit_id=bu_id, data=data)
        
        AuditService.record(
            action="CREATE",
            resource="appraisal.ReviewCycle",
            resource_id=str(cycle.id),
            changes=data,
            status="SUCCESS"
        )
        return cycle

    @transaction.atomic
    def update_cycle(self, security_context: SecurityContext, cycle_id: uuid.UUID, data: Dict[str, Any]) -> ReviewCycle:
        bu_id = security_context.require_business_unit()
        cycle = self.repository.get_by_id(cycle_id, bu_id)
        if not cycle:
            raise ResourceNotFoundException("Review cycle not found")

        data["updated_by_id"] = security_context.effective_user_id
        cycle = self.repository.update(cycle, data)
        
        AuditService.record(
            action="UPDATE",
            resource="appraisal.ReviewCycle",
            resource_id=str(cycle.id),
            changes=data,
            status="SUCCESS"
        )
        return cycle

    @transaction.atomic
    def delete_cycle(self, security_context: SecurityContext, cycle_id: uuid.UUID) -> None:
        bu_id = security_context.require_business_unit()
        cycle = self.repository.get_by_id(cycle_id, bu_id)
        if not cycle:
            raise ResourceNotFoundException("Review cycle not found")

        self.repository.soft_delete(cycle, deleted_by_id=security_context.effective_user_id)
        
        AuditService.record(
            action="DELETE",
            resource="appraisal.ReviewCycle",
            resource_id=str(cycle_id),
            changes={},
            status="SUCCESS"
        )
