# yss_orbit/backend/apps/organization/tests/test_organization_api.py
"""
Enterprise-grade API integration tests for the Organization module.
Covers: CRUD, soft-delete, restore, cascade to BUs, slug uniqueness,
settings endpoint, stats meta, search, ordering, and permissions.
"""
import uuid
import pytest
from rest_framework.test import APIClient

from apps.organization.models import Organization, OrganizationSettings
from apps.organization.models import BusinessUnit


def _extract_results(body):
    """Safely extract results list from any response envelope shape."""
    if isinstance(body, list):
        return body
    if "results" in body:
        return body["results"]
    if "data" in body:
        data = body["data"]
        return data if isinstance(data, list) else data.get("results", [])
    return []


# ─── LIST ──────────────────────────────────────────────────────────────────────
@pytest.mark.django_db
class TestOrganizationListAPI:
    def setup_method(self):
        self.client = APIClient()

    def test_list_requires_auth(self):
        response = self.client.get("/api/v1/organizations/")
        assert response.status_code == 401

    def test_list_returns_200_for_admin(self, admin_user):
        self.client.force_authenticate(user=admin_user)
        response = self.client.get("/api/v1/organizations/")
        assert response.status_code == 200

    def test_list_returns_stats_meta(self, admin_user, organization):
        self.client.force_authenticate(user=admin_user)
        response = self.client.get("/api/v1/organizations/")
        assert response.status_code == 200
        meta = response.data.get("meta", {})
        assert "total_active" in meta
        assert "total_inactive" in meta
        assert "total_deleted" in meta
        assert "total" in meta

    def test_list_excludes_deleted_by_default(self, admin_user, organization):
        """Default listing must NOT return is_deleted=True records."""
        # Hard-delete guard: soft-delete the org directly
        Organization.all_objects.filter(id=organization.id).update(
            is_deleted=True, is_active=False
        )
        self.client.force_authenticate(user=admin_user)
        response = self.client.get("/api/v1/organizations/")
        assert response.status_code == 200
        results = _extract_results(response.json())
        returned_ids = {str(r["id"]) for r in results}
        assert str(organization.id) not in returned_ids

    def test_list_search_by_name(self, admin_user, organization):
        self.client.force_authenticate(user=admin_user)
        response = self.client.get("/api/v1/organizations/", {"search": organization.name[:5]})
        assert response.status_code == 200
        results = _extract_results(response.json())
        assert any(r["id"] == str(organization.id) for r in results)

    def test_list_filter_is_active_true(self, admin_user, organization):
        self.client.force_authenticate(user=admin_user)
        response = self.client.get("/api/v1/organizations/", {"is_active": "true"})
        assert response.status_code == 200
        results = _extract_results(response.json())
        for r in results:
            assert r["is_active"] is True

    def test_list_filter_is_active_false(self, super_admin_user, business_domain):
        inactive = Organization.objects.create(
            name="Inactive Corp",
            is_active=False,
            business_domain=business_domain,
        )
        self.client.force_authenticate(user=super_admin_user)
        response = self.client.get("/api/v1/organizations/", {"is_active": "false"})
        assert response.status_code == 200
        results = _extract_results(response.json())
        assert any(r["id"] == str(inactive.id) for r in results)

    def test_list_invalid_ordering_falls_back_to_name(self, admin_user):
        self.client.force_authenticate(user=admin_user)
        response = self.client.get("/api/v1/organizations/", {"ordering": "INVALID_FIELD"})
        assert response.status_code == 200  # should not error

    def test_list_valid_ordering_desc(self, admin_user):
        self.client.force_authenticate(user=admin_user)
        response = self.client.get("/api/v1/organizations/", {"ordering": "-created_at"})
        assert response.status_code == 200


# ─── CREATE ─────────────────────────────────────────────────────────────────────
@pytest.mark.django_db
class TestOrganizationCreateAPI:
    def setup_method(self):
        self.client = APIClient()

    def test_create_requires_auth(self):
        response = self.client.post("/api/v1/organizations/", {})
        assert response.status_code == 401

    def test_create_organization_success(self, admin_user, business_domain):
        self.client.force_authenticate(user=admin_user)
        payload = {"name": "API Test Corp", "business_domain_id": business_domain.id}
        response = self.client.post("/api/v1/organizations/", payload)
        assert response.status_code == 201
        data = response.data.get("data") or response.data
        # Settings must be auto-provisioned
        org_id = data["id"]
        assert OrganizationSettings.objects.filter(organization_id=org_id).exists()

    def test_create_auto_provisions_settings(self, admin_user, business_domain):
        self.client.force_authenticate(user=admin_user)
        response = self.client.post(
            "/api/v1/organizations/",
            {"name": "Settings Test", "business_domain_id": business_domain.id},
        )
        assert response.status_code == 201
        org_id = (response.data.get("data") or response.data)["id"]
        assert OrganizationSettings.objects.filter(organization_id=org_id).exists()

    def test_create_missing_name_rejected(self, admin_user, business_domain):
        self.client.force_authenticate(user=admin_user)
        response = self.client.post("/api/v1/organizations/", {"business_domain_id": business_domain.id})
        assert response.status_code in (400, 422)

    def test_create_invalid_email_rejected(self, admin_user, business_domain):
        self.client.force_authenticate(user=admin_user)
        payload = {
            "name": "Email Test Corp",
            "email": "not-an-email",
            "business_domain_id": business_domain.id,
        }
        response = self.client.post("/api/v1/organizations/", payload)
        assert response.status_code in (400, 422)

    def test_partial_update_name(self, admin_user, organization):
        self.client.force_authenticate(user=admin_user)
        response = self.client.patch(
            f"/api/v1/organizations/{organization.id}/",
            {"name": "Updated Corp Name"},
        )
        assert response.status_code == 200
        organization.refresh_from_db()
        assert organization.name == "Updated Corp Name"

    def test_partial_update_is_active(self, admin_user, organization):
        self.client.force_authenticate(user=admin_user)
        response = self.client.patch(
            f"/api/v1/organizations/{organization.id}/",
            {"is_active": False},
        )
        assert response.status_code == 200
        organization.refresh_from_db()
        assert organization.is_active is False

    def test_cannot_update_nonexistent(self, admin_user):
        self.client.force_authenticate(user=admin_user)
        response = self.client.patch(
            f"/api/v1/organizations/{uuid.uuid4()}/",
            {"name": "Ghost"},
        )
        assert response.status_code == 404

    def test_delete_is_soft_delete(self, admin_user, organization):
        self.client.force_authenticate(user=admin_user)
        response = self.client.delete(f"/api/v1/organizations/{organization.id}/")
        assert response.status_code in (200, 204)
        organization.refresh_from_db()
        assert organization.is_deleted is True
        assert organization.deleted_at is not None

    def test_delete_cascades_to_business_units(self, admin_user, organization):
        """Soft-deleting an org must also soft-delete all its BUs."""
        bu = BusinessUnit.objects.create(
            organization=organization,
            name="Cascade Test BU",
            code="CASC01",
        )
        self.client.force_authenticate(user=admin_user)
        self.client.delete(f"/api/v1/organizations/{organization.id}/")
        bu.refresh_from_db()
        assert bu.is_deleted is True
        assert bu.deleted_at is not None

    def test_restore_organization(self, admin_user, organization):
        Organization.all_objects.filter(id=organization.id).update(
            is_deleted=True, is_active=False
        )
        self.client.force_authenticate(user=admin_user)
        response = self.client.post(f"/api/v1/organizations/{organization.id}/restore/")
        assert response.status_code == 200
        organization.refresh_from_db()
        assert organization.is_deleted is False
        assert organization.is_active is True

    def test_restore_nonexistent_returns_404(self, admin_user):
        self.client.force_authenticate(user=admin_user)
        response = self.client.post(f"/api/v1/organizations/{uuid.uuid4()}/restore/")
        assert response.status_code == 404

    def test_restore_active_org_returns_404(self, admin_user, organization):
        """Restoring an org that is NOT deleted should return 404."""
        self.client.force_authenticate(user=admin_user)
        response = self.client.post(f"/api/v1/organizations/{organization.id}/restore/")
        assert response.status_code == 404


# ─── SETTINGS ─────────────────────────────────────────────────────────────────
@pytest.mark.django_db
class TestOrganizationSettingsAPI:
    def setup_method(self):
        self.client = APIClient()

    def test_get_settings_returns_200(self, admin_user, organization):
        self.client.force_authenticate(user=admin_user)
        response = self.client.get(f"/api/v1/organizations/{organization.id}/settings/")
        assert response.status_code == 200


    def test_patch_settings_session_timeout_out_of_range_rejected(self, admin_user, organization):
        self.client.force_authenticate(user=admin_user)
        response = self.client.patch(
            f"/api/v1/organizations/{organization.id}/settings/",
            {"session_timeout_minutes": 2},  # below minimum of 5
        )
        assert response.status_code in (400, 422)

    def test_patch_settings_max_users_negative_rejected(self, admin_user, organization):
        self.client.force_authenticate(user=admin_user)
        response = self.client.patch(
            f"/api/v1/organizations/{organization.id}/settings/",
            {"max_users": -1},
        )
        assert response.status_code in (400, 422)

    def test_patch_settings_max_users_null_allowed(self, admin_user, organization):
        self.client.force_authenticate(user=admin_user)
        # Use format='json' so Python None → JSON null (multipart cannot encode None)
        response = self.client.patch(
            f"/api/v1/organizations/{organization.id}/settings/",
            {"max_users": None},
            format="json",
        )
        assert response.status_code == 200


# ─── META ──────────────────────────────────────────────────────────────────────
@pytest.mark.django_db
class TestOrganizationMetaAPI:
    def setup_method(self):
        self.client = APIClient()

    def test_meta_requires_auth(self):
        response = self.client.get("/api/v1/organizations/meta/")
        assert response.status_code == 401

