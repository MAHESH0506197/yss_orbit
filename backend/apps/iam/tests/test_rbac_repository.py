import pytest
from apps.iam.repositories.permission_repository import PermissionRepository
from apps.iam.repositories.role_repository import RoleRepository
from apps.iam.tests.factories import PermissionFactory, RoleFactory

@pytest.mark.django_db
def test_permission_repository():
    perm = PermissionFactory(code="repo.test", is_active=True)
    repo = PermissionRepository()
    fetched = repo.get_by_code("repo.test")
    assert fetched == perm

@pytest.mark.django_db
def test_role_repository():
    role = RoleFactory(is_active=True)
    repo = RoleRepository()
    roles = repo.list_for_bu(role.business_unit_id)
    assert role in roles
