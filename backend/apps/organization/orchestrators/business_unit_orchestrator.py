# yss_orbit/backend/apps/business_unit/orchestrators/business_unit_orchestrator.py
"""
BusinessUnit Orchestrator — high-level workflow coordinator.
Composes services and fires lifecycle signals.

Mirrors OrganizationOrchestrator design.
"""
import logging
import uuid
from typing import Any

from apps.iam.security_context import SecurityContext
from apps.organization.models import BusinessUnit

logger = logging.getLogger(__name__)


class BusinessUnitOrchestrator:

    @staticmethod
    def provision_new_business_unit(
        security_context: SecurityContext,
        organization_id: uuid.UUID,
        name: str,
        code: str,
        is_main_branch: bool = False,
        **extra_fields: Any,
    ) -> BusinessUnit:
        """
        High-level workflow to create and provision a new Business Unit.
        Fires the business_unit_created signal after successful creation.
        """
        from apps.organization.services.business_unit_service import BusinessUnitService
        from apps.organization.models import Organization
        from apps.organization.events.events import business_unit_created

        org = Organization.objects.get(id=organization_id, is_deleted=False)

        data = {
            "organization": org,
            "name": name,
            "code": code,
            "industry": industry,
            "is_main_branch": is_main_branch,
            **extra_fields,
        }

        bu = BusinessUnitService().create_business_unit(
            security_context=security_context,
            data=data,
        )

        business_unit_created.send(sender=BusinessUnit, bu=bu)
        logger.info("Provisioned BusinessUnit %s (id=%s) for org %s", bu.name, bu.id, organization_id)
        return bu

    @staticmethod
    def offboard_business_unit(
        security_context: SecurityContext,
        bu_id: uuid.UUID,
    ) -> None:
        """
        High-level workflow to soft-delete (offboard) a Business Unit.
        Fires the business_unit_deleted signal after successful deletion.
        """
        from apps.organization.services.business_unit_service import BusinessUnitService
        from apps.organization.events.events import business_unit_deleted

        service = BusinessUnitService()
        bu = service.get_business_unit(bu_id)

        service.delete_business_unit(security_context=security_context, bu_id=bu_id)

        business_unit_deleted.send(sender=BusinessUnit, bu=bu)
        logger.info("Offboarded BusinessUnit %s (id=%s)", bu.name, bu_id)
