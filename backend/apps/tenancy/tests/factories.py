# yss_orbit\backend\apps\subscription\tests\factories.py
import factory
from faker import Faker
from django.utils import timezone

fake = Faker()

class BaseSubscriptionFactory(factory.django.DjangoModelFactory):
    class Meta:
        abstract = True
        
    name = factory.LazyFunction(fake.name)
    is_active = True
    created_at = factory.LazyFunction(timezone.now)
