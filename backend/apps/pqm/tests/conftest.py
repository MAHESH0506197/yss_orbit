import pytest
from apps.pqm.models.project import PQMProject
from apps.pqm.models.site import PQMSite
from apps.pqm.models.category import PQMCategory
from apps.pqm.models.contractor import PQMContractor
from apps.iam.security_context import SecurityContext

@pytest.fixture
def pqm_project(db, tenant_org, tenant_bu):
    return PQMProject.objects.create(
        organization_id=tenant_org.id,
        business_unit_id=tenant_bu.id,
        name="Test PQM Project",
        code="PROJ-001"
    )

@pytest.fixture
def pqm_site(db, tenant_org, tenant_bu, pqm_project):
    return PQMSite.objects.create(
        organization_id=tenant_org.id,
        business_unit_id=tenant_bu.id,
        project_id=pqm_project.id,
        name="Test Site 1"
    )

@pytest.fixture
def pqm_category(db, tenant_org, tenant_bu):
    return PQMCategory.objects.create(
        organization_id=tenant_org.id,
        business_unit_id=tenant_bu.id,
        name="Safety Issue"
    )

@pytest.fixture
def pqm_contractor(db, tenant_org, tenant_bu):
    return PQMContractor.objects.create(
        organization_id=tenant_org.id,
        business_unit_id=tenant_bu.id,
        name="Acme Construction",
        vendor_code="V-001"
    )

@pytest.fixture
def pqm_context(default_user, tenant_bu):
    """Creates a basic SecurityContext for the default user with full PQM permissions in tenant_bu."""
    return SecurityContext(
        user_id=default_user.id,
        business_unit_id=tenant_bu.id,
        correlation_id="test-corr-123",
        is_super_admin=True,
    )
