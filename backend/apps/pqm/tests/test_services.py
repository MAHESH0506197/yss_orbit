import pytest
from apps.pqm.models.non_conformance import NonConformance
from apps.pqm.enums import NCStatus
from apps.pqm.services.nc_service import NCService
from apps.pqm.services.approval_service import ApprovalService

@pytest.mark.django_db
class TestNCWorkflowServices:
    
    @pytest.fixture
    def draft_nc(self, tenant_org, tenant_bu, default_user, pqm_project, pqm_site):
        nc = NonConformance.objects.create(
            organization_id=tenant_org.id,
            business_unit_id=tenant_bu.id,
            project_id=pqm_project.id,
            site_id=pqm_site.id,
            title="Draft NC",
            raised_by_id=default_user.id,
            status=NCStatus.DRAFT
        )
        from apps.pqm.models.attachment import PQMAttachment
        from apps.pqm.enums import AttachmentStage
        PQMAttachment.objects.create(
            organization_id=tenant_org.id,
            business_unit_id=tenant_bu.id,
            nc=nc,
            file_name="dummy.jpg",
            file_key="dummy/path.jpg",
            uploaded_by_id=default_user.id,
            attachment_stage=AttachmentStage.BEFORE,
            created_by_id=default_user.id
        )
        return nc

    def test_submit_nc(self, draft_nc, default_user):
        updated_nc = NCService.submit_nc(draft_nc, default_user.id)
        assert updated_nc.status == NCStatus.SUBMITTED

    def test_assign_nc(self, draft_nc, default_user):
        NCService.submit_nc(draft_nc, default_user.id)
        NCService.transition_status(draft_nc, NCStatus.UNDER_REVIEW, default_user.id)
        NCService.transition_status(draft_nc, NCStatus.APPROVED, default_user.id)
        updated_nc = NCService.assign_nc(draft_nc, default_user.id, default_user.id)
        assert updated_nc.status == NCStatus.ASSIGNED

    def test_start_work(self, draft_nc, default_user):
        NCService.submit_nc(draft_nc, default_user.id)
        NCService.transition_status(draft_nc, NCStatus.UNDER_REVIEW, default_user.id)
        NCService.transition_status(draft_nc, NCStatus.APPROVED, default_user.id)
        NCService.assign_nc(draft_nc, default_user.id, default_user.id)
        updated_nc = NCService.transition_status(draft_nc, NCStatus.IN_PROGRESS, default_user.id)
        assert updated_nc.status == NCStatus.IN_PROGRESS

    def test_request_closure(self, draft_nc, default_user, tenant_org, tenant_bu):
        NCService.submit_nc(draft_nc, default_user.id)
        NCService.transition_status(draft_nc, NCStatus.UNDER_REVIEW, default_user.id)
        NCService.transition_status(draft_nc, NCStatus.APPROVED, default_user.id)
        NCService.assign_nc(draft_nc, default_user.id, default_user.id)
        NCService.transition_status(draft_nc, NCStatus.IN_PROGRESS, default_user.id)
        NCService.transition_status(draft_nc, NCStatus.RECTIFIED, default_user.id)

        # Satisfy closure gates
        draft_nc.root_cause_description = "Found issue"
        draft_nc.save()
        from apps.pqm.models.attachment import PQMAttachment
        from apps.pqm.enums import AttachmentStage
        PQMAttachment.objects.create(
            organization_id=tenant_org.id,
            business_unit_id=tenant_bu.id,
            nc=draft_nc,
            file_name="after.jpg",
            file_key="after.jpg",
            attachment_stage=AttachmentStage.AFTER,
            uploaded_by_id=default_user.id,
            created_by_id=default_user.id
        )

        updated_nc = ApprovalService.request_closure(draft_nc, default_user.id)
        assert updated_nc.status == NCStatus.VERIFICATION_PENDING

    def test_verify_nc(self, draft_nc, default_user, tenant_org, tenant_bu):
        draft_nc.approval_levels_required = 1
        draft_nc.save()
        
        NCService.submit_nc(draft_nc, default_user.id)
        NCService.transition_status(draft_nc, NCStatus.UNDER_REVIEW, default_user.id)
        NCService.transition_status(draft_nc, NCStatus.APPROVED, default_user.id)
        NCService.assign_nc(draft_nc, default_user.id, default_user.id)
        NCService.transition_status(draft_nc, NCStatus.IN_PROGRESS, default_user.id)
        NCService.transition_status(draft_nc, NCStatus.RECTIFIED, default_user.id)

        draft_nc.root_cause_description = "Found issue"
        draft_nc.save()
        from apps.pqm.models.attachment import PQMAttachment
        from apps.pqm.enums import AttachmentStage
        PQMAttachment.objects.create(
            organization_id=tenant_org.id,
            business_unit_id=tenant_bu.id,
            nc=draft_nc,
            file_name="after.jpg",
            file_key="after.jpg",
            attachment_stage=AttachmentStage.AFTER,
            uploaded_by_id=default_user.id,
            created_by_id=default_user.id
        )
        ApprovalService.request_closure(draft_nc, default_user.id)

        updated_nc = ApprovalService.make_verification_decision(
            draft_nc, level=1, decision="Approved", approver_id=default_user.id
        )
        # Verify transition APPROVED_FOR_CLOSURE -> CLOSED? Wait, make_verification_decision sets it to CLOSED if level >= required.
        assert updated_nc.status == NCStatus.CLOSED

    def test_invalid_transition_raises_error(self, draft_nc, default_user):
        from django.core.exceptions import ValidationError
        with pytest.raises(ValidationError, match="Cannot transition"):
            NCService.transition_status(draft_nc, NCStatus.ASSIGNED, default_user.id)
