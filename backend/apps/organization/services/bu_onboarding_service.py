# yss_orbit/backend/apps/business_unit/services/bu_onboarding_service.py
"""
BusinessUnit Onboarding Service.
Mirrors OrganizationOnboardingService design.
Wraps the core BusinessUnitService for onboarding-specific flows.
"""
import logging
import uuid
from typing import Any

from django.db import transaction

from apps.iam.security_context import SecurityContext
from apps.organization.models import BusinessUnit

logger = logging.getLogger(__name__)


class BuOnboardingService:
    """
    Handles the onboarding workflow for a new Business Unit.
    Called during Organization provisioning when the first BU
    must be created alongside the parent Organization.
    """

    @classmethod
    @transaction.atomic
    def onboard(
        cls,
        security_context: SecurityContext,
        organization_id: uuid.UUID,
        name: str,
        code: str,
        industry: str = "RETAIL",
        **extra_fields: Any,
    ) -> BusinessUnit:
        """
        Create the initial Business Unit for a newly provisioned Organization.
        Sets is_main_branch=True — the first BU is always the main branch.
        """
        from apps.organization.services.business_unit_service import BusinessUnitService
        from apps.organization.models import Organization

        org = Organization.objects.get(id=organization_id, is_deleted=False)

        data = {
            "organization": org,
            "name": name,
            "code": code.strip().upper(),
            "is_main_branch": True,
            **extra_fields,
        }

        bu = BusinessUnitService().create_business_unit(
            security_context=security_context,
            data=data,
        )
        logger.info(
            "Onboarded BusinessUnit '%s' (id=%s) as main branch for org %s",
            bu.name, bu.id, organization_id,
        )
        return bu
