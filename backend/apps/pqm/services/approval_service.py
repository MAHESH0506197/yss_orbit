# yss_orbit\backend\apps\pqm\services\approval_service.py
"""
Approval Service — manages review and multi-level verification chain.
"""
from __future__ import annotations

import uuid
from django.utils import timezone

from apps.pqm.enums import NCStatus, ApprovalDecision, ApprovalStage


class ApprovalService:

    @staticmethod
    def make_review_decision(
        nc: object,
        decision: str,
        approver_id: uuid.UUID,
        comments: str = "",
    ) -> object:
        from apps.pqm.models.approval_step import PQMApprovalStep
        from apps.pqm.services.nc_service import NCService
        from apps.pqm.services.notification_service import NotificationService

        step, _ = PQMApprovalStep.objects.get_or_create(
            nc=nc,
            stage=ApprovalStage.REVIEW,
            sequence_order=1,
            defaults={
                "organization_id": nc.organization_id,
                "business_unit_id": nc.business_unit_id,
                "approver_id": approver_id,
            },
        )
        step.decision = decision
        step.comments = comments
        step.decided_at = timezone.now()
        step.save(update_fields=["decision", "comments", "decided_at", "updated_at"])

        if decision == ApprovalDecision.APPROVED:
            NCService.transition_status(nc, NCStatus.APPROVED, approver_id, comments)
            NotificationService.send_nc_event(nc, "nc_approved_review")
        elif decision == ApprovalDecision.REJECTED:
            # "Return" — put back to Draft for revision
            NCService.transition_status(nc, NCStatus.REJECTED, approver_id, comments)
            NotificationService.send_nc_event(nc, "nc_rejected")
        # "Return" is handled by caller as REJECTED → DRAFT transition

        return nc

    @staticmethod
    def request_closure(nc: object, engineer_id: uuid.UUID) -> object:
        from apps.pqm.validators import validate_closure_gate
        from apps.pqm.services.nc_service import NCService
        from apps.pqm.services.notification_service import NotificationService

        validate_closure_gate(nc)
        nc_updated = NCService.transition_status(
            nc, NCStatus.VERIFICATION_PENDING, engineer_id,
            reason="Closure requested by engineer",
        )
        nc_updated.current_approval_level = 0
        nc_updated.save(update_fields=["current_approval_level", "updated_at"])
        NotificationService.send_nc_event(nc_updated, "nc_closure_requested")
        return nc_updated

    @staticmethod
    def make_verification_decision(
        nc: object,
        level: int,
        decision: str,
        approver_id: uuid.UUID,
        comments: str = "",
    ) -> object:
        from apps.pqm.models.approval_step import PQMApprovalStep
        from apps.pqm.services.nc_service import NCService
        from apps.pqm.services.notification_service import NotificationService

        step, _ = PQMApprovalStep.objects.get_or_create(
            nc=nc,
            stage=ApprovalStage.VERIFICATION,
            sequence_order=level,
            defaults={
                "organization_id": nc.organization_id,
                "business_unit_id": nc.business_unit_id,
                "approver_id": approver_id,
            },
        )
        step.decision = decision
        step.comments = comments
        step.decided_at = timezone.now()
        step.save(update_fields=["decision", "comments", "decided_at", "updated_at"])

        if decision == ApprovalDecision.REWORK:
            NCService.transition_status(nc, NCStatus.ASSIGNED, approver_id, comments)
            NotificationService.send_nc_event(nc, "nc_verification_rejected")

        elif decision == ApprovalDecision.APPROVED:
            nc.current_approval_level = level
            nc.save(update_fields=["current_approval_level", "updated_at"])

            if level >= nc.approval_levels_required:
                # Final approval — transition to Approved for Closure then close the NC
                NCService.transition_status(nc, NCStatus.APPROVED_FOR_CLOSURE, approver_id, comments)
                NCService.transition_status(nc, NCStatus.CLOSED, approver_id, "Auto-closed after final verification")
                NotificationService.send_nc_event(nc, "nc_closed")
            else:
                # Intermediate approval — stay in VERIFICATION_PENDING for next level
                NotificationService.send_nc_event(nc, "nc_verification_approved")

        return nc

    @staticmethod
    def reopen_nc(nc: object, actor_id: uuid.UUID, reason: str) -> object:
        from apps.pqm.services.nc_service import NCService
        from apps.pqm.services.notification_service import NotificationService

        if not reason or not reason.strip():
            from django.core.exceptions import ValidationError
            raise ValidationError("A reason is required to reopen an NC.")

        nc_updated = NCService.transition_status(nc, NCStatus.REOPENED, actor_id, reason)
        NotificationService.send_nc_event(nc_updated, "nc_reopened")
        return nc_updated
