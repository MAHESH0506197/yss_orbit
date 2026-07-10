# yss_orbit/backend/apps/user_business_unit/tests/test_ubu_lifecycle.py
import uuid
from datetime import timedelta
from unittest.mock import patch

from django.test import TestCase
from django.utils import timezone
from rest_framework.exceptions import AuthenticationFailed

from apps.organization.models import BusinessDomain
from apps.organization.models import Organization
from apps.organization.models import BusinessUnit
from apps.iam.models import User
from apps.iam.models.rbac_models import Role
from apps.organization.services.user_business_unit_service import UserBusinessUnitService
from apps.organization.models.user_business_unit_model import UserBusinessUnitModel
from apps.iam.security_context import SecurityContext
from apps.organization.selectors.user_business_unit_selectors import get_active_memberships_query


class UBULifecycleTest(TestCase):
    def setUp(self):
        self.domain1 = BusinessDomain.objects.get_or_create(name="Healthcare", defaults={"code": "HC"})[0]
        self.domain2 = BusinessDomain.objects.create(name="Retail " + __import__("uuid").uuid4().hex[:8], code="RET" + __import__("uuid").uuid4().hex[:4])

        self.org = Organization.objects.create(name="Org 1", business_domain=self.domain1)
        self.org_retail = Organization.objects.create(name="Org Retail", business_domain=self.domain2)
        
        self.bu1 = BusinessUnit.objects.create(name="BU 1", code="BU1", organization=self.org)
        self.bu2 = BusinessUnit.objects.create(name="BU 2", code="BU2", organization=self.org)
        self.bu_retail = BusinessUnit.objects.create(name="BU Retail", code="BURET", organization=self.org_retail)
        
        self.user = User.objects.create_user(username="testuser", email="test@example.com", password="pwd")
        self.sc = SecurityContext(user_id=self.user.id, correlation_id="test")

        self.role1 = Role.objects.create(name="Role 1", business_unit_id=self.bu1.id)
        self.role2 = Role.objects.create(name="Role 2", business_unit_id=self.bu1.id)
        self.retail_role = Role.objects.create(name="Retail Role", business_unit_id=self.bu_retail.id)

        self.service = UserBusinessUnitService()

    def test_transfer_revokes_old_and_creates_new(self):
        membership = self.service.create_membership(self.sc, self.user.id, self.bu1.id, self.role1.id)
        self.assertTrue(membership.is_active_membership)
        
        new_mem = self.service.transfer_membership(self.sc, membership.id, self.bu2.id, self.role1.id)
        
        membership.refresh_from_db()
        self.assertTrue(membership.is_deleted)
        self.assertFalse(membership.is_active)
        
        self.assertEqual(new_mem.business_unit_id, self.bu2.id)

    def test_domain_mismatch_raises_validation_error(self):
        # Dynamically inject business_domain_id for the test to simulate a Domain-scoped Role
        self.retail_role.business_domain_id = self.domain2.id
        # bu1 inherently has domain1
        with patch("apps.iam.models.Role.objects.get") as mock_role_get:
            mock_role_get.return_value = self.retail_role
            with self.assertRaisesMessage(ValueError, "Domain mismatch"):
                self.service.create_membership(self.sc, self.user.id, self.bu1.id, self.retail_role.id)

    def test_effective_dates_enforced_in_security_context(self):
        past = timezone.now() - timedelta(days=10)
        expired = timezone.now() - timedelta(days=1)
        
        self.service.create_membership(self.sc, self.user.id, self.bu1.id, self.role1.id, effective_from=past, effective_to=expired)
        
        # Security context/selector should ignore it
        active = get_active_memberships_query().filter(user_id=self.user.id, business_unit_id=self.bu1.id).exists()
        self.assertFalse(active)

    def test_multiple_roles_allowed_in_same_bu(self):
        self.service.create_membership(self.sc, self.user.id, self.bu1.id, self.role1.id)
        self.service.create_membership(self.sc, self.user.id, self.bu1.id, self.role2.id)
        
        count = UserBusinessUnitModel.objects.filter(user=self.user, business_unit=self.bu1).count()
        self.assertEqual(count, 2)

    def test_suspension_precedence_revokes_access(self):
        self.service.create_membership(self.sc, self.user.id, self.bu1.id, self.role1.id)
        
        # Suspend BU
        self.bu1.is_active = False
        self.bu1.save()
        
        active = get_active_memberships_query().filter(user_id=self.user.id).exists()
        self.assertFalse(active)

        # Restore BU, suspend Org
        self.bu1.is_active = True
        self.bu1.save()
        self.org.is_active = False
        self.org.save()
        
        active = get_active_memberships_query().filter(user_id=self.user.id).exists()
        self.assertFalse(active)

    def test_domain_inheritance(self):
        self.assertEqual(self.bu1.business_domain, self.org.business_domain)
        self.assertEqual(self.bu1.business_domain_id, self.domain1.id)
        self.assertEqual(self.bu_retail.business_domain, self.org_retail.business_domain)
        self.assertEqual(self.bu_retail.business_domain_id, self.domain2.id)
