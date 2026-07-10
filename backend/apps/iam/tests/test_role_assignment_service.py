import uuid
from unittest.mock import patch
from django.test import TestCase
from django.utils import timezone

from apps.iam.models.rbac_models import Role, UserRole
from apps.iam.models import User
from apps.organization.models.organization_model import Organization
from apps.organization.models import BusinessUnit
from apps.iam.services.role_assignment_service import RoleAssignmentService


class RoleAssignmentServiceTest(TestCase):
    def setUp(self):
        # Create user
        self.user = User.objects.create(
            email="testuser@example.com",
            username="testuser",
            is_active=True
        )
        self.actor = User.objects.create(
            email="actor@example.com",
            username="actor",
            is_active=True
        )

        # Create Org and BU
        self.org = Organization.objects.create(name="Test Org", business_domain=__import__('apps.organization.models.business_domain_model', fromlist=['BusinessDomain']).BusinessDomain.objects.get_or_create(name='Test Domain ' + __import__('uuid').uuid4().hex[:8], code='TEST' + __import__('uuid').uuid4().hex[:4])[0])
        self.bu1 = BusinessUnit.objects.create(name="BU 1", code="BU1", organization=self.org)
        self.bu2 = BusinessUnit.objects.create(name="BU 2", code="BU2", organization=self.org)

        # Create Roles
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
        self.role3 = Role.objects.create(
            name="Role 3",
            role_type="CUSTOM",
            business_unit_id=self.bu2.id,
            is_active=True
        )

    @patch("apps.iam.services.role_assignment_service.AuditService.record")
    def test_assign_role_success(self, mock_audit):
        """Test assigning a new role to a user."""
        new_user_role = RoleAssignmentService.sync_user_role(
            user_id=self.user.id,
            business_unit_id=self.bu1.id,
            new_role_id=self.role1.id,
            actor_user_id=self.actor.id
        )

        self.assertIsNotNone(new_user_role)
        self.assertEqual(new_user_role.role_id, self.role1.id)
        self.assertTrue(new_user_role.is_active)
        self.assertEqual(new_user_role.assigned_by_id, self.actor.id)
        mock_audit.assert_called_once()
        call_kwargs = mock_audit.call_args.kwargs
        self.assertEqual(call_kwargs["action"], "ASSIGN")
        self.assertEqual(call_kwargs["resource"], "rbac.UserRole")

    @patch("apps.iam.services.role_assignment_service.AuditService.record")
    def test_assign_role_idempotency(self, mock_audit):
        """Test assigning the same role twice does nothing."""
        RoleAssignmentService.sync_user_role(
            user_id=self.user.id,
            business_unit_id=self.bu1.id,
            new_role_id=self.role1.id,
            actor_user_id=self.actor.id
        )
        mock_audit.reset_mock()

        # Second call with identical arguments
        new_user_role = RoleAssignmentService.sync_user_role(
            user_id=self.user.id,
            business_unit_id=self.bu1.id,
            new_role_id=self.role1.id,
            actor_user_id=self.actor.id
        )

        self.assertEqual(new_user_role.role_id, self.role1.id)
        self.assertTrue(new_user_role.is_active)
        # Should NOT trigger audit or DB write
        mock_audit.assert_not_called()

    @patch("apps.iam.services.role_assignment_service.AuditService.record")
    def test_revoke_role(self, mock_audit):
        """Test revoking a role (setting new_role_id=None)."""
        RoleAssignmentService.sync_user_role(
            user_id=self.user.id,
            business_unit_id=self.bu1.id,
            new_role_id=self.role1.id,
            actor_user_id=self.actor.id
        )
        mock_audit.reset_mock()

        revoked_role = RoleAssignmentService.sync_user_role(
            user_id=self.user.id,
            business_unit_id=self.bu1.id,
            new_role_id=None,
            actor_user_id=self.actor.id
        )

        self.assertIsNone(revoked_role)
        # Verify it was set to inactive
        db_role = UserRole.objects.get(user_id=self.user.id, business_unit_id=self.bu1.id)
        self.assertFalse(db_role.is_active)
        self.assertIsNotNone(db_role.revoked_at)

        mock_audit.assert_called_once()
        self.assertEqual(mock_audit.call_args.kwargs["action"], "REVOKE")

    @patch("apps.iam.services.role_assignment_service.AuditService.record")
    def test_restore_role_reactivates_existing(self, mock_audit):
        """Test assigning a previously revoked role reactivates the row."""
        RoleAssignmentService.sync_user_role(
            user_id=self.user.id,
            business_unit_id=self.bu1.id,
            new_role_id=self.role1.id,
            actor_user_id=self.actor.id
        )
        RoleAssignmentService.sync_user_role(
            user_id=self.user.id,
            business_unit_id=self.bu1.id,
            new_role_id=None,
            actor_user_id=self.actor.id
        )
        mock_audit.reset_mock()

        # Restore
        restored = RoleAssignmentService.sync_user_role(
            user_id=self.user.id,
            business_unit_id=self.bu1.id,
            new_role_id=self.role1.id,
            actor_user_id=self.actor.id
        )

        self.assertTrue(restored.is_active)
        self.assertIsNone(restored.revoked_at)
        
        mock_audit.assert_called_once()
        self.assertEqual(mock_audit.call_args.kwargs["action"], "REACTIVATE")

    @patch("apps.iam.services.role_assignment_service.AuditService.record")
    def test_reassign_new_role_revokes_old(self, mock_audit):
        """Test assigning a new role revokes the old active role in the same BU."""
        RoleAssignmentService.sync_user_role(
            user_id=self.user.id,
            business_unit_id=self.bu1.id,
            new_role_id=self.role1.id,
            actor_user_id=self.actor.id
        )
        mock_audit.reset_mock()

        # Reassign to role2
        RoleAssignmentService.sync_user_role(
            user_id=self.user.id,
            business_unit_id=self.bu1.id,
            new_role_id=self.role2.id,
            actor_user_id=self.actor.id
        )

        # old role is revoked
        old = UserRole.objects.get(user_id=self.user.id, role_id=self.role1.id)
        self.assertFalse(old.is_active)
        # new role is active
        new = UserRole.objects.get(user_id=self.user.id, role_id=self.role2.id)
        self.assertTrue(new.is_active)

        self.assertEqual(mock_audit.call_count, 2)
        actions = [call.kwargs["action"] for call in mock_audit.call_args_list]
        self.assertIn("REVOKE", actions)
        self.assertIn("ASSIGN", actions)

    @patch("apps.iam.services.role_assignment_service.AuditService.record")
    def test_cross_bu_assignment(self, mock_audit):
        """Test a user can have active roles in multiple distinct BUs."""
        RoleAssignmentService.sync_user_role(
            user_id=self.user.id,
            business_unit_id=self.bu1.id,
            new_role_id=self.role1.id,
            actor_user_id=self.actor.id
        )
        RoleAssignmentService.sync_user_role(
            user_id=self.user.id,
            business_unit_id=self.bu2.id,
            new_role_id=self.role3.id,
            actor_user_id=self.actor.id
        )

        active_roles = UserRole.objects.filter(user_id=self.user.id, is_active=True)
        self.assertEqual(active_roles.count(), 2)
        bu_ids = [str(r.business_unit_id) for r in active_roles]
        self.assertIn(str(self.bu1.id), bu_ids)
        self.assertIn(str(self.bu2.id), bu_ids)
