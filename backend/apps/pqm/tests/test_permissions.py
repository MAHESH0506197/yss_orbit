import pytest
from apps.pqm.permissions import PQMPermission, HasPQMPermission, HasPQMPermission
from apps.iam.security_context import SecurityContext

@pytest.mark.django_db
class TestPQMPermissions:

    def test_check_permission_granted(self, pqm_context, default_user, rf):
        request = rf.get("/api/v1/pqm/nc/")
        request.user = default_user
        request.security_context = pqm_context

        # pqm_context fixture sets is_global_admin = True
        assert PQMPermission.check_permission(request, PQMPermission.VIEW_NC) is True

    def test_check_permission_denied_no_context(self, default_user, rf):
        request = rf.get("/api/v1/pqm/nc/")
        request.user = default_user
        # missing security_context
        
        assert PQMPermission.check_permission(request, PQMPermission.VIEW_NC) is False

    def test_drf_has_permission_integration(self, pqm_context, default_user, rf):
        request = rf.get("/api/v1/pqm/nc/")
        request.user = default_user
        request.security_context = pqm_context
        
        # Test class instantiation behaves correctly
        perm = HasPQMPermission()
        # Mock view with required permission
        class MockView:
            required_pqm_permission = PQMPermission.VIEW_NC
        assert perm.has_permission(request, MockView()) is True # Default requires at least VIEW_NC
