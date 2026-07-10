import pytest
from django.urls import reverse
from rest_framework import status
from apps.payroll.models import ProfessionalTaxSlab

pytestmark = pytest.mark.django_db


class TestProfessionalTaxSlabViews:
    def test_pt_slab_crud(self, auth_client, default_user, tenant_bu):
        url = reverse("api_v1:payroll:pt-slab-list")
        
        # Create
        data = {
            "state_code": "KA",
            "financial_year": "2026-27",
            "salary_from": 15000,
            "salary_to": 999999,
            "monthly_pt_amount": 200,
            "is_active": True
        }
        res = auth_client.post(url, data, HTTP_X_BUSINESS_UNIT_ID=str(tenant_bu.id))
        assert res.status_code == status.HTTP_201_CREATED
        assert res.data["state_code"] == "KA"
        slab_id = res.data["id"]
        
        # Read
        res = auth_client.get(url, HTTP_X_BUSINESS_UNIT_ID=str(tenant_bu.id))
        assert len(res.data["data"]["results"]) == 1
        
        # Update
        detail_url = reverse("api_v1:payroll:pt-slab-detail", kwargs={"pk": slab_id})
        res = auth_client.patch(detail_url, {"monthly_pt_amount": 250}, HTTP_X_BUSINESS_UNIT_ID=str(tenant_bu.id))
        assert res.status_code == status.HTTP_200_OK
        assert res.data["monthly_pt_amount"] == '250.00'
        
        # Delete
        res = auth_client.delete(detail_url, HTTP_X_BUSINESS_UNIT_ID=str(tenant_bu.id))
        assert res.status_code == status.HTTP_204_NO_CONTENT
        assert ProfessionalTaxSlab.objects.count() == 0
