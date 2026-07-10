import factory
from apps.iam.models.rbac_models import Permission, Role, RolePermission, UserRole
import uuid

class PermissionFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Permission
    
    code = factory.Sequence(lambda n: f"module.resource.action_{n}")
    name = factory.Faker("word")
    module = "test_module"

class RoleFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Role
    
    name = factory.Sequence(lambda n: f"Role {n}")
    business_unit_id = factory.LazyFunction(uuid.uuid4)
    tenant_id = factory.LazyFunction(uuid.uuid4)

class UserRoleFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = UserRole
        
    user_id = factory.LazyFunction(uuid.uuid4)
    business_unit_id = factory.LazyFunction(uuid.uuid4)
    role = factory.SubFactory(RoleFactory)
