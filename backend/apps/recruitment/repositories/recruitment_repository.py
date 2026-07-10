# yss_orbit\backend\apps\recruitment\repositories\recruitment_repository.py
from typing import Optional, Any
from django.db.models import QuerySet
from apps.appraisal.models.appraisal_model import Appraisal
from apps.recruitment.models import (
    JobPosting, JobApplication, Appraisal,
    InterviewStage, Interview
)
from apps.platform.core_exceptions import ResourceNotFoundException

class RecruitmentRepository:
    # ─── Job Postings ────────────────────────────────────────────────────────
    def get_job_posting(self, ctx: Any, bu_id: str, posting_id: str) -> JobPosting:
        try:
            return JobPosting.objects.get(id=posting_id, business_unit_id=bu_id)
        except JobPosting.DoesNotExist:
            raise ResourceNotFoundException("JobPosting")

    def create_job_posting(self, ctx: Any, bu_id: str, data: dict[str, Any]) -> JobPosting:
        data['business_unit_id'] = bu_id
        return JobPosting.objects.create(**data)
        
    def update_job_posting(self, ctx: Any, posting: JobPosting, data: dict[str, Any]) -> JobPosting:
        for key, value in data.items():
            setattr(posting, key, value)
        posting.save()
        return posting
        
    def list_job_postings(self, ctx: Any, bu_id: str) -> QuerySet[JobPosting]:
        return JobPosting.objects.filter(business_unit_id=bu_id)
        
    # ─── Job Applications ────────────────────────────────────────────────────
    def get_job_application(self, ctx: Any, bu_id: str, application_id: str) -> JobApplication:
        try:
            return JobApplication.objects.get(id=application_id, business_unit_id=bu_id)
        except JobApplication.DoesNotExist:
            raise ResourceNotFoundException("JobApplication")

    def create_job_application(self, ctx: Any, bu_id: str, data: dict[str, Any]) -> JobApplication:
        data['business_unit_id'] = bu_id
        return JobApplication.objects.create(**data)
        
    def update_job_application(self, ctx: Any, application: JobApplication, data: dict[str, Any]) -> JobApplication:
        for key, value in data.items():
            setattr(application, key, value)
        application.save()
        return application
        
    def list_job_applications(self, ctx: Any, bu_id: str) -> QuerySet[JobApplication]:
        return JobApplication.objects.filter(business_unit_id=bu_id)

    # ─── Interviews ──────────────────────────────────────────────────────────
    def get_interview_stage(self, ctx: Any, bu_id: str, stage_id: str) -> InterviewStage:
        try:
            return InterviewStage.objects.get(id=stage_id, business_unit_id=bu_id)
        except InterviewStage.DoesNotExist:
            raise ResourceNotFoundException("InterviewStage")

    def create_interview_stage(self, ctx: Any, bu_id: str, data: dict[str, Any]) -> InterviewStage:
        data['business_unit_id'] = bu_id
        return InterviewStage.objects.create(**data)

    def list_interview_stages(self, ctx: Any, bu_id: str) -> QuerySet[InterviewStage]:
        return InterviewStage.objects.filter(business_unit_id=bu_id)

    def get_interview(self, ctx: Any, bu_id: str, interview_id: str) -> Interview:
        try:
            return Interview.objects.get(id=interview_id, business_unit_id=bu_id)
        except Interview.DoesNotExist:
            raise ResourceNotFoundException("Interview")

    def create_interview(self, ctx: Any, bu_id: str, data: dict[str, Any]) -> Interview:
        data['business_unit_id'] = bu_id
        return Interview.objects.create(**data)
        
    def update_interview(self, ctx: Any, interview: Interview, data: dict[str, Any]) -> Interview:
        for key, value in data.items():
            setattr(interview, key, value)
        interview.save()
        return interview

    def list_interviews(self, ctx: Any, bu_id: str) -> QuerySet[Interview]:
        return Interview.objects.filter(business_unit_id=bu_id)

    # ─── Employee Appraisals ─────────────────────────────────────────────────
    def get_appraisal(self, ctx: Any, bu_id: str, appraisal_id: str) -> Appraisal:
        try:
            return Appraisal.objects.get(id=appraisal_id, business_unit_id=bu_id)
        except Appraisal.DoesNotExist:
            raise ResourceNotFoundException("Appraisal")

    def create_appraisal(self, ctx: Any, bu_id: str, data: dict[str, Any]) -> Appraisal:
        data['business_unit_id'] = bu_id
        return Appraisal.objects.create(**data)
        
    def update_appraisal(self, ctx: Any, appraisal: Appraisal, data: dict[str, Any]) -> Appraisal:
        for key, value in data.items():
            setattr(appraisal, key, value)
        appraisal.save()
        return appraisal

    def list_appraisals(self, ctx: Any, bu_id: str) -> QuerySet[Appraisal]:
        return Appraisal.objects.filter(business_unit_id=bu_id)
