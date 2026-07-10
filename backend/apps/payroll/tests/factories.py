# yss_orbit\backend\apps\payroll\tests\factories.py
import factory
from apps.payroll.payroll_model import PayrollRun, Payslip
from django.utils import timezone
import uuid

class PayrollRunFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = PayrollRun

    business_unit_id = factory.LazyFunction(uuid.uuid4)
    month = 5
    year = 2025
    status = PayrollRun.Status.DRAFT
    run_by_id = factory.LazyFunction(uuid.uuid4)
    correlation_id = factory.LazyFunction(lambda: str(uuid.uuid4()))

class PayslipFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Payslip

    payroll_run = factory.SubFactory(PayrollRunFactory)
    business_unit_id = factory.SelfAttribute('payroll_run.business_unit_id')
    employee_id = factory.LazyFunction(uuid.uuid4)
    employee_code = factory.Sequence(lambda n: f"EMP{n:04d}")
    employee_name = factory.Faker("name")
    month = factory.SelfAttribute('payroll_run.month')
    year = factory.SelfAttribute('payroll_run.year')
