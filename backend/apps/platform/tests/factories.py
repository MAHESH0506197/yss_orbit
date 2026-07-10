# yss_orbit\backend\apps\support\tests\factories.py
import factory
from apps.platform.models import Ticket, TicketCategory

class TicketCategoryFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = TicketCategory
    name = factory.Faker('word')

class TicketFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Ticket
    subject = factory.Faker('sentence')
    description = factory.Faker('text')\n