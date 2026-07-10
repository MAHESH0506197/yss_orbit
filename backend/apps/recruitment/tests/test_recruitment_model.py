# yss_orbit\backend\apps\recruitment\tests\test_recruitment_model.py
import pytest
from apps.recruitment.tests.factories import JobPostingFactory, JobApplicationFactory

@pytest.mark.django_db
class TestRecruitmentModel:
    def test_job_posting_creation(self, tenant_bu):
        job = JobPostingFactory(business_unit_id=tenant_bu.id)
        assert job.status == "DRAFT"
        assert job.total_openings == 1

    def test_job_application_creation(self):
        app = JobApplicationFactory()
        assert app.status == "APPLIED"
        assert app.full_name == f"{app.first_name} {app.last_name}"
