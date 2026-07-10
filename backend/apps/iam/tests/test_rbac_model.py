import pytest
from apps.iam.tests.factories import PermissionFactory, RoleFactory

@pytest.mark.django_db
def test_permission_creation():
    perm = PermissionFactory(code="test.read")
    assert perm.code == "test.read"
    assert str(perm) == "test.read"

@pytest.mark.django_db
def test_role_creation():
    role = RoleFactory(name="Admin")
    assert role.name == "Admin"
    assert "Admin" in str(role)
