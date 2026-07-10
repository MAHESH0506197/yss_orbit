import pytest
from django.urls import reverse
from rest_framework import status
from apps.hrms.models import LeaveType, LeavePolicy, LeaveRestrictionWindow, HolidayCalendar, Holiday, LeaveBalance, Employee

pytestmark = pytest.mark.django_db


class TestSetupViews:
    def test_leave_policy_crud(self, auth_client, default_user, tenant_bu):
        url = reverse("api_v1:hrms:leave-policies-list")
        
        # Create
        data = {
            "name": "Global Leave Policy",
            "description": "Applies to all employees",
            "is_active": True
        }
        res = auth_client.post(url, data, HTTP_X_BUSINESS_UNIT_ID=str(tenant_bu.id))
        assert res.status_code == status.HTTP_201_CREATED
        print("COUNT:", LeavePolicy.objects.count())
        if LeavePolicy.objects.count() > 0:
            p = LeavePolicy.objects.first()
            print("BU ID:", p.business_unit_id, "EXPECTED:", tenant_bu.id)
            print("IS ACTIVE:", p.is_active)
        assert res.data["name"] == "Global Leave Policy"
        policy_id = res.data["id"]
        
        # Read
        res = auth_client.get(url, HTTP_X_BUSINESS_UNIT_ID=str(tenant_bu.id))
        assert len(res.data["data"]["results"]) == 1
        
        # Update
        detail_url = reverse("api_v1:hrms:leave-policies-detail", kwargs={"pk": policy_id})
        res = auth_client.patch(detail_url, {"name": "Updated Policy"}, HTTP_X_BUSINESS_UNIT_ID=str(tenant_bu.id))
        assert res.status_code == status.HTTP_200_OK
        assert res.data["name"] == "Updated Policy"
        
        # Delete
        res = auth_client.delete(detail_url, HTTP_X_BUSINESS_UNIT_ID=str(tenant_bu.id))
        assert res.status_code == status.HTTP_204_NO_CONTENT
        assert LeavePolicy.objects.count() == 0

    def test_leave_type_crud(self, auth_client, default_user, tenant_bu):
        policy = LeavePolicy.objects.create(business_unit_id=tenant_bu.id, name="Policy 1")

        url = reverse("api_v1:hrms:leave-types-list")
        data = {
            "policy": policy.id,
            "code": "CL",
            "name": "Casual Leave",
            "is_paid": True,
            "is_active": True
        }
        res = auth_client.post(url, data, HTTP_X_BUSINESS_UNIT_ID=str(tenant_bu.id))
        assert res.status_code == status.HTTP_201_CREATED
        
        # Update
        type_id = res.data["id"]
        detail_url = reverse("api_v1:hrms:leave-types-detail", kwargs={"pk": type_id})
        res = auth_client.patch(detail_url, {"allow_half_day": True}, HTTP_X_BUSINESS_UNIT_ID=str(tenant_bu.id))
        assert res.status_code == status.HTTP_200_OK
        assert LeaveType.objects.get(id=type_id).allow_half_day is True

    def test_leave_allocation(self, auth_client, default_user, tenant_bu):
        # Create Policy, Type, Employee
        policy = LeavePolicy.objects.create(business_unit_id=tenant_bu.id, name="P1")
        ltype = LeaveType.objects.create(business_unit_id=tenant_bu.id, policy=policy, code="CL", name="CL")
        from datetime import date
        emp1 = Employee.objects.create(
            business_unit_id=tenant_bu.id, employee_code="E01", first_name="A", last_name="B", personal_email="a@b.com", date_of_joining=date(2026, 1, 1)
        )
        emp2 = Employee.objects.create(
            business_unit_id=tenant_bu.id, employee_code="E02", first_name="C", last_name="D", personal_email="c@d.com", date_of_joining=date(2026, 1, 1)
        )
        
        url = reverse("api_v1:hrms:leave-allocations")
        data = {
            "year": 2026,
            "leave_type_id": str(ltype.id),
            "allocations": [
                {"employee_id": str(emp1.id), "opening_balance": 15},
                {"employee_id": str(emp2.id), "opening_balance": 12.5}
            ]
        }
        
        res = auth_client.post(url, data, format="json", HTTP_X_BUSINESS_UNIT_ID=str(tenant_bu.id))
        assert res.status_code == status.HTTP_200_OK
        assert res.data["data"]["created"] == 2
        assert LeaveBalance.objects.count() == 2
        assert LeaveBalance.objects.get(employee=emp1).opening_balance == 15
        
        # Test update existing
        data["allocations"][0]["opening_balance"] = 16
        res = auth_client.post(url, data, format="json", HTTP_X_BUSINESS_UNIT_ID=str(tenant_bu.id))
        assert res.status_code == status.HTTP_200_OK
        assert res.data["data"]["updated"] == 2
        assert LeaveBalance.objects.get(employee=emp1).opening_balance == 16

    def test_holiday_calendar_and_holiday(self, auth_client, default_user, tenant_bu):
        # Create Calendar
        url = reverse("api_v1:hrms:holiday-calendars-list")
        res = auth_client.post(url, {"name": "Karnataka 2026", "year": 2026, "is_active": True}, HTTP_X_BUSINESS_UNIT_ID=str(tenant_bu.id))
        assert res.status_code == status.HTTP_201_CREATED
        cal_id = res.data["id"]
        
        # Create Holiday
        holiday_url = reverse("api_v1:hrms:holiday-list", kwargs={"calendar_id": cal_id})
        res = auth_client.post(holiday_url, {"name": "Diwali", "date": "2026-11-04", "is_active": True}, HTTP_X_BUSINESS_UNIT_ID=str(tenant_bu.id))
        assert res.status_code == status.HTTP_201_CREATED
        assert res.data["name"] == "Diwali"
        
        # Verify nested returned on calendar
        res = auth_client.get(reverse("api_v1:hrms:holiday-calendars-detail", kwargs={"pk": cal_id}), HTTP_X_BUSINESS_UNIT_ID=str(tenant_bu.id))
        assert len(res.data["holidays"]) == 1
        assert res.data["holidays"][0]["name"] == "Diwali"
