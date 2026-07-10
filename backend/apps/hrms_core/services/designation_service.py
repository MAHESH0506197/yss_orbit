# DEPRECATED - DO NOT USE. Scheduled for removal. Use apps.hrms instead.
# yss_orbit/backend/apps/hrms_core/services/designation_service.py
import logging
import uuid
from typing import Dict, Any

from django.db import transaction

from apps.platform.core_exceptions import ResourceNotFoundException
from apps.iam.security_context import SecurityContext
from apps.hrms_core.models import Designation
from apps.hrms_core.repositories.designation_repository import DesignationRepository
from core.audit.audit_service import AuditService

logger = logging.getLogger(__name__)

class DesignationService:
    """
    Service class handling business logic for Designation.
    """
    def __init__(self):
        self.repository = DesignationRepository()

    @transaction.atomic
    def create_designation(self, security_context: SecurityContext, data: Dict[str, Any]) -> Designation:
        bu_id = security_context.require_business_unit()
        
        data["created_by_id"] = security_context.effective_user_id
        data["updated_by_id"] = security_context.effective_user_id

        designation = self.repository.create(business_unit_id=bu_id, data=data)
        
        AuditService.record(
            action="CREATE",
            resource="hrms_core.Designation",
            resource_id=str(designation.id),
            changes=data,
            status="SUCCESS"
        )
        return designation

    @transaction.atomic
    def update_designation(self, security_context: SecurityContext, designation_id: uuid.UUID, data: Dict[str, Any]) -> Designation:
        bu_id = security_context.require_business_unit()
        designation = self.repository.get_by_id(designation_id, bu_id)
        if not designation:
            raise ResourceNotFoundException("Designation not found")

        data["updated_by_id"] = security_context.effective_user_id
        designation = self.repository.update(designation, data)
        
        AuditService.record(
            action="UPDATE",
            resource="hrms_core.Designation",
            resource_id=str(designation.id),
            changes=data,
            status="SUCCESS"
        )
        return designation

    @transaction.atomic
    def delete_designation(self, security_context: SecurityContext, designation_id: uuid.UUID) -> None:
        bu_id = security_context.require_business_unit()
        designation = self.repository.get_by_id(designation_id, bu_id)
        if not designation:
            raise ResourceNotFoundException("Designation not found")

        self.repository.soft_delete(designation, deleted_by_id=security_context.effective_user_id)
        
        AuditService.record(
            action="DELETE",
            resource="hrms_core.Designation",
            resource_id=str(designation_id),
            changes={},
            status="SUCCESS"
        )
