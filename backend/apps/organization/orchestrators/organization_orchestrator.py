# yss_orbit/backend/apps/organization/orchestrators/organization_orchestrator.py
import logging
from apps.organization.models import Organization, OrganizationSettings

logger = logging.getLogger(__name__)


class OrganizationOrchestrator:
    @staticmethod
    def provision_new_organization(name: str, slug: str, admin_email: str, business_domain_id: str | None = None) -> Organization:
        from apps.organization.organizations_service import OrganizationService
        service = OrganizationService()
        
        payload = {"name": name, "email": admin_email}
        if business_domain_id:
            payload["business_domain_id"] = business_domain_id
        else:
            # Fallback to the default seed domain if not provided during orchestrator setup
            from apps.organization.models import BusinessDomain
            default_domain = BusinessDomain.objects.filter(code="DEFAULT").first()
            if default_domain:
                payload["business_domain_id"] = default_domain.id

        org = service.create_organization(payload)
        logger.info("Provisioned org %s", org.id)
        return org

    @staticmethod
    def offboard_organization(org_id, deleted_by_id=None) -> None:
        from apps.organization.organizations_service import OrganizationService
        OrganizationService().delete_organization(org_id=org_id, deleted_by_id=deleted_by_id)
        logger.info("Offboarded org %s", org_id)
