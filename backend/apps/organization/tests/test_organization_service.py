import pytest
from apps.organization.organizations_service import OrganizationService
from apps.platform.core_exceptions import ValidationException


@pytest.mark.django_db
class TestOrganizationService:
    def setup_method(self):
        self.service = OrganizationService()

    def test_create_organization(self, org_data):
        org = self.service.create_organization(org_data)
        assert org.name == org_data["name"]

    def test_soft_delete(self, organization):
        self.service.delete_organization(organization.id)
        organization.refresh_from_db()
        assert organization.is_deleted is True

    def test_restore(self, organization):
        self.service.delete_organization(organization.id)
        restored = self.service.restore_organization(organization.id)
        assert restored.is_deleted is False
        assert restored.is_active is True
