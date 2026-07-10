# yss_orbit\backend\apps\attendance\tests\factories.py
import factory
import uuid
from apps.hrms.models import Shift, AttendanceRecord, Employee
from django.utils import timezone

class EmployeeFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Employee
    business_unit_id = factory.LazyFunction(uuid.uuid4)
    first_name = "Test"
    last_name = "Employee"
    employee_code = factory.Sequence(lambda n: f"EMP{n}")
    date_of_joining = factory.LazyFunction(lambda: timezone.now().date())

class ShiftFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Shift
    name = factory.Sequence(lambda n: f"Shift {n}")
    start_time = "09:00:00"
    end_time = "18:00:00"
    business_unit_id = factory.LazyFunction(uuid.uuid4)

class AttendanceRecordFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = AttendanceRecord
    business_unit_id = factory.LazyFunction(uuid.uuid4)
    employee = factory.SubFactory(EmployeeFactory, business_unit_id=factory.SelfAttribute('..business_unit_id'))
    attendance_date = factory.LazyFunction(lambda: timezone.now().date())
    status = "PRESENT"
