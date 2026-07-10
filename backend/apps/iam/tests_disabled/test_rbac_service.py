import pytest
import uuid
from apps.iam.services.rbac_service import RBACService
from apps.iam.tests.factories import RoleFactory

@pytest.mark.django_db
def test_assign_role():
    role = RoleFactory(is_active=True)
    user_id = uuid.uuid4()
    
    user_role = RBACService.assign_role(user_id, role.business_unit_id, role.id)
    
    assert user_role.user_id == user_id
    assert user_role.role == role
    assert user_role.is_active is True
