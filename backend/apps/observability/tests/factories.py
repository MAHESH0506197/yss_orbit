# yss_orbit\backend\apps\reporting\tests\factories.py
import factory
from django.utils import timezone
# In a real scenario, we would import the model here
# from .models import MyModel

class BaseFactory(factory.django.DjangoModelFactory):
    class Meta:
        abstract = True
        
    created_at = factory.LazyFunction(timezone.now)
    updated_at = factory.LazyFunction(timezone.now)
