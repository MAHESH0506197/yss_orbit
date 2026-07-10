# yss_orbit/backend/apps/recruitment/services/recruitment_service.py
from typing import Any
from django.db.models import QuerySet
from apps.recruitment.repositories.recruitment_repository import RecruitmentRepository
from apps.appraisal.models.appraisal_model import Appraisal
from apps.recruitment.models import (
    JobPosting, JobApplication, Appraisal,
    InterviewStage, Interview
)
from apps.platform.core_exceptions import ValidationException
from apps.iam.security_context import SecurityContext
from apps.platform.services.outbox_service import OutboxService

class RecruitmentService:
    def __init__(self, repository: RecruitmentRepository = None):
        self.repo = repository or RecruitmentRepository()

    # ─── Job Postings ────────────────────────────────────────────────────────
    def create_job_posting(self, security_context: SecurityContext, data: dict[str, Any]) -> JobPosting:
        bu_id = str(security_context.require_business_unit())
        # Pass bu_id as expected by repo, or ideally refactor repo too. We'll pass ctx to repo.
        return self.repo.create_job_posting(security_context, bu_id, data)

    def get_job_posting(self, security_context: SecurityContext, posting_id: str) -> JobPosting:
        bu_id = str(security_context.require_business_unit())
        return self.repo.get_job_posting(security_context, bu_id, posting_id)

    def update_job_posting(self, security_context: SecurityContext, posting_id: str, data: dict[str, Any]) -> JobPosting:
        bu_id = str(security_context.require_business_unit())
        posting = self.repo.get_job_posting(security_context, bu_id, posting_id)
        return self.repo.update_job_posting(security_context, posting, data)

    def delete_job_posting(self, security_context: SecurityContext, posting_id: str) -> None:
        bu_id = str(security_context.require_business_unit())
        posting = self.repo.get_job_posting(security_context, bu_id, posting_id)
        posting.soft_delete()
        
    def list_job_postings(self, security_context: SecurityContext) -> QuerySet[JobPosting]:
        bu_id = str(security_context.require_business_unit())
        return self.repo.list_job_postings(security_context, bu_id)

    # ─── Job Applications ────────────────────────────────────────────────────
    def create_job_application(self, security_context: SecurityContext, data: dict[str, Any]) -> JobApplication:
        bu_id = str(security_context.require_business_unit())
        return self.repo.create_job_application(security_context, bu_id, data)

    def get_job_application(self, security_context: SecurityContext, application_id: str) -> JobApplication:
        bu_id = str(security_context.require_business_unit())
        return self.repo.get_job_application(security_context, bu_id, application_id)

    def update_job_application(self, security_context: SecurityContext, application_id: str, data: dict[str, Any]) -> JobApplication:
        bu_id = str(security_context.require_business_unit())
        app = self.repo.get_job_application(security_context, bu_id, application_id)
        return self.repo.update_job_application(security_context, app, data)
        
    def list_job_applications(self, security_context: SecurityContext) -> QuerySet[JobApplication]:
        bu_id = str(security_context.require_business_unit())
        return self.repo.list_job_applications(security_context, bu_id)

    def advance_application_stage(self, security_context: SecurityContext, application_id: str) -> JobApplication:
        bu_id = str(security_context.require_business_unit())
        app = self.repo.get_job_application(security_context, bu_id, application_id)
        
        status_flow = [
            JobApplication.ApplicationStatus.APPLIED,
            JobApplication.ApplicationStatus.SCREENING,
            JobApplication.ApplicationStatus.SHORTLISTED,
            JobApplication.ApplicationStatus.INTERVIEWING,
            JobApplication.ApplicationStatus.OFFERED,
            JobApplication.ApplicationStatus.ACCEPTED,
            JobApplication.ApplicationStatus.HIRED,
        ]
        
        try:
            current_idx = status_flow.index(app.status)
            if current_idx < len(status_flow) - 1:
                next_status = status_flow[current_idx + 1]
                updated_app = self.repo.update_job_application(security_context, app, {"status": next_status})
                
                if next_status == JobApplication.ApplicationStatus.HIRED:
                    # Publish event for HRMS onboarding
                    OutboxService.publish(
                        message_type="recruitment.applicant.hired",
                        destination="hrms.events",
                        payload={
                            "application_id": str(updated_app.id),
                            "applicant_name": f"{updated_app.first_name} {updated_app.last_name}",
                            "applicant_email": updated_app.email,
                            "job_posting_id": str(updated_app.job_posting.id),
                            "business_unit_id": str(bu_id),
                        }
                    )
                return updated_app
            else:
                raise ValidationException("Application is already at the final stage.")
        except ValueError:
            raise ValidationException("Application cannot be advanced from its current state.")

    # ─── Interviews ──────────────────────────────────────────────────────────
    def create_interview_stage(self, security_context: SecurityContext, data: dict[str, Any]) -> InterviewStage:
        bu_id = str(security_context.require_business_unit())
        return self.repo.create_interview_stage(security_context, bu_id, data)

    def get_interview_stage(self, security_context: SecurityContext, stage_id: str) -> InterviewStage:
        bu_id = str(security_context.require_business_unit())
        return self.repo.get_interview_stage(security_context, bu_id, stage_id)

    def list_interview_stages(self, security_context: SecurityContext) -> QuerySet[InterviewStage]:
        bu_id = str(security_context.require_business_unit())
        return self.repo.list_interview_stages(security_context, bu_id)

    def create_interview(self, security_context: SecurityContext, data: dict[str, Any]) -> Interview:
        bu_id = str(security_context.require_business_unit())
        # Before creating interview, update application status if not already interviewing
        app = self.get_job_application(security_context, data['application'])
        if app.status not in [JobApplication.ApplicationStatus.INTERVIEWING, JobApplication.ApplicationStatus.OFFERED, JobApplication.ApplicationStatus.ACCEPTED, JobApplication.ApplicationStatus.HIRED]:
             self.repo.update_job_application(security_context, app, {"status": JobApplication.ApplicationStatus.INTERVIEWING})
        return self.repo.create_interview(security_context, bu_id, data)

    def get_interview(self, security_context: SecurityContext, interview_id: str) -> Interview:
        bu_id = str(security_context.require_business_unit())
        return self.repo.get_interview(security_context, bu_id, interview_id)

    def update_interview(self, security_context: SecurityContext, interview_id: str, data: dict[str, Any]) -> Interview:
        bu_id = str(security_context.require_business_unit())
        interview = self.repo.get_interview(security_context, bu_id, interview_id)
        return self.repo.update_interview(security_context, interview, data)

    def list_interviews(self, security_context: SecurityContext) -> QuerySet[Interview]:
        bu_id = str(security_context.require_business_unit())
        return self.repo.list_interviews(security_context, bu_id)


    # ─── Employee Appraisals ─────────────────────────────────────────────────
    def create_appraisal(self, security_context: SecurityContext, data: dict[str, Any]) -> Appraisal:
        bu_id = str(security_context.require_business_unit())
        return self.repo.create_appraisal(security_context, bu_id, data)

    def get_appraisal(self, security_context: SecurityContext, appraisal_id: str) -> Appraisal:
        bu_id = str(security_context.require_business_unit())
        return self.repo.get_appraisal(security_context, bu_id, appraisal_id)

    def update_appraisal(self, security_context: SecurityContext, appraisal_id: str, data: dict[str, Any]) -> Appraisal:
        bu_id = str(security_context.require_business_unit())
        appraisal = self.repo.get_appraisal(security_context, bu_id, appraisal_id)
        return self.repo.update_appraisal(security_context, appraisal, data)
        
    def list_appraisals(self, security_context: SecurityContext) -> QuerySet[Appraisal]:
        bu_id = str(security_context.require_business_unit())
        return self.repo.list_appraisals(security_context, bu_id)

    def submit_appraisal(self, security_context: SecurityContext, appraisal_id: str) -> Appraisal:
        bu_id = str(security_context.require_business_unit())
        appraisal = self.repo.get_appraisal(security_context, bu_id, appraisal_id)
        
        if appraisal.status == Appraisal.AppraisalStatus.PENDING_SELF:
            return self.repo.update_appraisal(security_context, appraisal, {"status": Appraisal.AppraisalStatus.PENDING_MANAGER})
        elif appraisal.status == Appraisal.AppraisalStatus.PENDING_MANAGER:
            return self.repo.update_appraisal(security_context, appraisal, {"status": Appraisal.AppraisalStatus.COMPLETED})
        else:
            raise ValidationException("Appraisal cannot be submitted from its current state.")
