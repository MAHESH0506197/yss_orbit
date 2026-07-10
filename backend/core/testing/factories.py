# yss_orbit\backend\core\testing\factories.py
"""
Base factory setups for test data generation.
"""
import factory
from django.contrib.auth import get_user_model
from apps.organization.models.organization_model import Organization as Tenant

User = get_user_model()

class TenantFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Tenant

    name = factory.Faker("company")
    domain = factory.Faker("domain_word")
    is_active = True

class UserFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = User

    email = factory.Faker("email")
    first_name = factory.Faker("first_name")
    last_name = factory.Faker("last_name")
