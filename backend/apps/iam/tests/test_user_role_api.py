from rest_framework.test import APITestCase
from django.urls import reverse
from rest_framework import status
import uuid

from apps.iam.models import User
from apps.organization.models.organization_model import Organization
from apps.organization.models import BusinessUnit
from apps.iam.models.rbac_models import Role, UserRole

class UserRoleApiTest(APITestCase):
    def setUp(self):
        # Admin user
        self.admin = User.objects.create(
            email="admin@example.com",
            username="admin",
            is_active=True,
            is_super_admin=True
        )
        # Regular user
        self.user = User.objects.create(
            email="user@example.com",
            username="user",
            is_active=True
        )
        
        self.org = Organization.objects.create(name="Test Org", business_domain=__import__('apps.organization.models.business_domain_model', fromlist=['BusinessDomain']).BusinessDomain.objects.get_or_create(name='Test Domain ' + __import__('uuid').uuid4().hex[:8], code='TEST' + __import__('uuid').uuid4().hex[:4])[0])
        self.bu1 = BusinessUnit.objects.create(name="BU 1", code="BU1", organization=self.org)
        
        self.role1 = Role.objects.create(
            name="Role 1",
            role_type="CUSTOM",
            business_unit_id=self.bu1.id,
            is_active=True
        )
        self.role2 = Role.objects.create(
            name="Role 2",
            role_type="CUSTOM",
            business_unit_id=self.bu1.id,
            is_active=True
        )

        self.list_url = reverse("api_v1:user-roles-list")
        self.client.force_authenticate(user=self.admin)
        
        # Simulate active security context for tests
        # We patch SecurityContext globally via middleware or similar, but for API tests 
        # we can pass headers or patch it. Wait, the views use request.security_context
        # We need to set it up or patch it if permissions are enforced.
        # But wait, UserRoleViewSet has permission_classes = [IsAuthenticated, HasRBACPermission]
        # For simplicity, we can mock the permission check or just give the admin full permissions.

    def _grant_admin_permissions(self):
        # Create superadmin role and grant it
        sa_role = Role.objects.create(
            name="SA Role",
            role_type="SYSTEM",
            business_unit_id=self.bu1.id,
            is_active=True
        )
        # Mocking has_permission directly or granting it in DB?
        pass

    def test_create_user_role(self):
        # Actually, let's test the endpoint directly and patch HasRBACPermission
        from unittest.mock import patch
        with patch('core.permissions.rbac_permission.HasRBACPermission.has_permission', return_value=True):
            payload = {
                "user_id": str(self.user.id),
                "business_unit_id": str(self.bu1.id),
                "role_id": str(self.role1.id)
            }
            response = self.client.post(self.list_url, data=payload)
            self.assertEqual(response.status_code, status.HTTP_201_CREATED)
            
            ur = UserRole.objects.get(user_id=self.user.id, business_unit_id=self.bu1.id)
            self.assertEqual(ur.role_id, self.role1.id)
            self.assertTrue(ur.is_active)

    def test_list_user_roles(self):
        UserRole.objects.create(
            user_id=self.user.id,
            role=self.role1,
            business_unit_id=self.bu1.id,
            is_active=True
        )
        from unittest.mock import patch
        with patch('core.permissions.rbac_permission.HasRBACPermission.has_permission', return_value=True):
            response = self.client.get(self.list_url)
            self.assertEqual(response.status_code, status.HTTP_200_OK)
            # Response should be unwrapped structure
            self.assertIn("data", response.data)
            data = response.data["data"]
            results = data.get("results", data) if isinstance(data, dict) else data
            self.assertEqual(len(results), 1)

    def test_update_user_role(self):
        ur = UserRole.objects.create(
            user_id=self.user.id,
            role=self.role1,
            business_unit_id=self.bu1.id,
            is_active=True
        )
        detail_url = reverse("api_v1:user-roles-detail", kwargs={"pk": ur.id})
        
        from unittest.mock import patch
        with patch('core.permissions.rbac_permission.HasRBACPermission.has_permission', return_value=True):
            payload = {"role_id": str(self.role2.id)}
            response = self.client.patch(detail_url, data=payload)
            self.assertEqual(response.status_code, status.HTTP_200_OK)
            
            # The API patch updates the record directly because there is no custom update method
            ur.refresh_from_db()
            self.assertTrue(ur.is_active)  # Remains active
            self.assertEqual(ur.role_id, self.role2.id)

    def test_delete_user_role(self):
        ur = UserRole.objects.create(
            user_id=self.user.id,
            role=self.role1,
            business_unit_id=self.bu1.id,
            is_active=True
        )
        detail_url = reverse("api_v1:user-roles-detail", kwargs={"pk": ur.id})
        
        from unittest.mock import patch
        with patch('core.permissions.rbac_permission.HasRBACPermission.has_permission', return_value=True):
            response = self.client.delete(detail_url)
            self.assertEqual(response.status_code, status.HTTP_200_OK)
            
            ur.refresh_from_db()
            self.assertFalse(ur.is_active)
            self.assertIsNotNone(ur.revoked_at)

    def test_restore_user_role(self):
        ur = UserRole.objects.create(
            user_id=self.user.id,
            role=self.role1,
            business_unit_id=self.bu1.id,
            is_active=False,
            revoked_at="2023-01-01T00:00:00Z"
        )
        restore_url = reverse("api_v1:user-roles-restore", kwargs={"pk": ur.id})
        
        from unittest.mock import patch
        with patch('core.permissions.rbac_permission.HasRBACPermission.has_permission', return_value=True):
            response = self.client.post(restore_url)
            self.assertEqual(response.status_code, status.HTTP_200_OK)
            
            ur.refresh_from_db()
            self.assertTrue(ur.is_active)
            self.assertIsNone(ur.revoked_at)
