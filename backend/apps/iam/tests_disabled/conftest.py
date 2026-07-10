import pytest
from apps.iam.tests.factories import PermissionFactory, RoleFactory, UserRoleFactory

@pytest.fixture
def permission():
    return PermissionFactory()

@pytest.fixture
def role():
    return RoleFactory()

@pytest.fixture
def user_role():
    return UserRoleFactory()
