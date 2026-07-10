# yss_orbit\backend\apps\user_business_unit\tests\factories.py
import factory

class BaseFactory(factory.django.DjangoModelFactory):
    class Meta:
        abstract = True
