import pytest
from apps.organization.models import Organization


@pytest.mark.django_db
class TestOrganizationModel:
    def test_str(self, organization):
        assert str(organization) == organization.name

    def test_soft_delete_flag(self, organization):
        assert organization.is_deleted is False
        organization.is_deleted = True
        organization.save()
        assert Organization.all_objects.filter(id=organization.id, is_deleted=True).exists()

    def test_organization_domain_cannot_change_if_bus_exist(self, db):
        from apps.organization.models import BusinessDomain
        from apps.organization.models import BusinessUnit
        from django.core.exceptions import ValidationError
        
        domain1 = BusinessDomain.objects.get_or_create(name="Domain 1", code="D1")[0]
        domain2 = BusinessDomain.objects.get_or_create(name="Domain 2", code="D2")[0]
        
        org = Organization.objects.create(name="Org With BUs", business_domain=domain1)
        BusinessUnit.objects.create(name="BU 1", code="BU1", organization=org)
        
        # Changing domain should fail
        org.business_domain = domain2
        with pytest.raises(ValidationError, match="Cannot change the business domain"):
            org.save()
