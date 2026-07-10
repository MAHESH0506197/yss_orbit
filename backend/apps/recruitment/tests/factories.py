# yss_orbit\backend\apps\recruitment\tests\factories.py
import factory
from apps.recruitment.models import JobPosting, JobApplication
from django.utils import timezone
import uuid

class JobPostingFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = JobPosting

    business_unit_id = factory.LazyFunction(uuid.uuid4)
    title = factory.Faker("job")
    job_code = factory.Sequence(lambda n: f"JOB-{n:04d}")
    status = JobPosting.PostingStatus.DRAFT

class JobApplicationFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = JobApplication

    job_posting = factory.SubFactory(JobPostingFactory)
    business_unit_id = factory.SelfAttribute('job_posting.business_unit_id')
    first_name = factory.Faker("first_name")
    last_name = factory.Faker("last_name")
    email = factory.Faker("email")
    phone = factory.Faker("phone_number")
    status = JobApplication.ApplicationStatus.APPLIED
