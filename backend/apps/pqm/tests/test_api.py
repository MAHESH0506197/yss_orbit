import pytest
from rest_framework.test import APIClient
from apps.pqm.models.non_conformance import NonConformance
from apps.pqm.enums import NCStatus

import unittest.mock as mock

@pytest.fixture
def api_client(pqm_context, default_user):
    client = APIClient()
    client.force_authenticate(user=default_user)
    client.defaults['HTTP_X_BUSINESS_UNIT_ID'] = str(pqm_context.business_unit_id)
    return client

@pytest.fixture(autouse=True)
def mock_permission():
    with mock.patch('apps.pqm.permissions.PQMPermission.check_permission', return_value=True):
        with mock.patch('apps.pqm.permissions.IsProjectMember.has_permission', return_value=True):
            yield

@pytest.mark.django_db
class TestNCApi:

    def test_list_ncs(self, api_client, tenant_org, tenant_bu, default_user, pqm_project, pqm_site):
        NonConformance.objects.create(
            organization_id=tenant_org.id,
            business_unit_id=tenant_bu.id,
            title="API List Test NC",
            project_id=pqm_project.id,
            site_id=pqm_site.id,
            raised_by_id=default_user.id,
            status=NCStatus.DRAFT
        )
        
        response = api_client.get(f"/api/v1/pqm/nc/?project={pqm_project.id}")
        print(response.data)
        assert response.status_code == 200
        assert response.data["success"] is True
        assert len(response.data["data"]["results"]) == 1
        assert response.data["data"]["results"][0]["title"] == "API List Test NC"

    def test_create_nc(self, api_client, pqm_project, pqm_site):
        payload = {
            "title": "New NC created via API",
            "description": "Details here",
            "project": str(pqm_project.id),
            "site": str(pqm_site.id),
        }
        response = api_client.post("/api/v1/pqm/nc/", data=payload, format="json")
        print(response.data)
        assert response.status_code == 201
        assert response.data["success"] is True
        assert response.data["data"]["title"] == "New NC created via API"
        assert response.data["data"]["status"] == NCStatus.DRAFT
