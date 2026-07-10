import pytest
from django.db import IntegrityError
from apps.pqm.models.non_conformance import NonConformance
from apps.pqm.enums import NCStatus

@pytest.mark.django_db
class TestNonConformanceModel:

    def test_create_valid_nc(self, tenant_org, tenant_bu, pqm_project, pqm_site, default_user):
        nc = NonConformance.objects.create(
            organization_id=tenant_org.id,
            business_unit_id=tenant_bu.id,
            title="Safety hazard near crane",
            description="No hard hats observed.",
            project_id=pqm_project.id,
            site_id=pqm_site.id,
            raised_by_id=default_user.id,
            created_by_id=default_user.id,
            status=NCStatus.DRAFT
        )
        assert nc.id is not None
        assert nc.nc_number == ""  # Number generated on submit, not draft
        assert nc.status == NCStatus.DRAFT

    def test_soft_delete_inheritance(self, tenant_org, tenant_bu, pqm_project, pqm_site, default_user):
        nc = NonConformance.objects.create(
            organization_id=tenant_org.id,
            business_unit_id=tenant_bu.id,
            title="Test NC",
            project_id=pqm_project.id,
            site_id=pqm_site.id,
            raised_by_id=default_user.id,
            created_by_id=default_user.id,
        )
        assert not nc.is_deleted
        nc.soft_delete()  # Should trigger soft delete if inherited correctly
        nc.refresh_from_db()
        assert nc.is_deleted

    def test_invalid_status_constraint(self, tenant_org, tenant_bu, pqm_project, pqm_site, default_user):
        nc = NonConformance(
            organization_id=tenant_org.id,
            business_unit_id=tenant_bu.id,
            title="Test NC",
            project_id=pqm_project.id,
            site_id=pqm_site.id,
            raised_by_id=default_user.id,
            created_by_id=default_user.id,
            status="INVALID_STATUS"
        )
        with pytest.raises(IntegrityError):
            nc.save()

    def test_business_unit_fk_required(self, tenant_org, pqm_project, pqm_site, default_user):
        nc = NonConformance(
            organization_id=tenant_org.id,
            # missing business_unit
            title="Test NC",
            project_id=pqm_project.id,
            site_id=pqm_site.id,
            raised_by_id=default_user.id,
            created_by_id=default_user.id,
        )
        with pytest.raises(IntegrityError):
            nc.save()
