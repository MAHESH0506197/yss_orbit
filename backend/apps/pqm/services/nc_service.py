# yss_orbit\backend\apps\pqm\services\nc_service.py
"""
NC Service — core business logic for NC lifecycle.
All status transitions go through this service. Never write nc.status directly.
"""
from __future__ import annotations

import uuid
from typing import Any

from django.db import transaction
from django.utils import timezone

from apps.pqm.enums import NCStatus, Priority, NCSeries
from apps.pqm.validators import (
    validate_before_photos_on_submit,
    validate_closure_gate,
    validate_nc_transition,
    validate_client_captured_at,
)


class NCService:

    @staticmethod
    def create_nc(
        bu_id: uuid.UUID,
        organization_id: uuid.UUID,
        data: dict[str, Any],
        user_id: uuid.UUID,
    ) -> "NonConformance":  # type: ignore[name-defined]
        from apps.pqm.models import NonConformance, PQMEscalationConfig

        is_safety_critical = data.get("is_safety_critical", False)
        
        priority_id = data.get("priority_id")
        priority_str = Priority.MEDIUM
        from apps.pqm.models.dropdown_option import PQMDropdownOption
        if priority_id:
            opt = PQMDropdownOption.objects.filter(id=priority_id).first()
            if opt:
                priority_str = opt.system_mapping or opt.name
                if opt.system_mapping == "Critical":
                    is_safety_critical = True

        # Validate offline timestamp if provided
        client_captured_at = data.get("client_captured_at")
        if client_captured_at:
            validate_client_captured_at(client_captured_at)

        # Calculate target closure date
        target_date = NCService._calculate_target_date(
            organization_id, bu_id, priority_str, is_safety_critical
        )

        nc = NonConformance(
            business_unit_id=bu_id,
            organization_id=organization_id,
            status=NCStatus.DRAFT,
            raised_by_id=user_id,
            created_by_id=user_id,
            target_closure_date=target_date,
            original_target_closure_date=target_date,
            **{k: v for k, v in data.items()
               if k not in ("business_unit_id", "organization_id", "raised_by_id",
                            "status", "nc_number", "created_by_id", "target_closure_date")},
        )
        nc.save()
        return nc

    @staticmethod
    def submit_nc(nc: "NonConformance", user_id: uuid.UUID) -> "NonConformance":  # type: ignore[name-defined]
        from apps.pqm.services.numbering_service import NumberingService
        from apps.pqm.services.duplicate_service import DuplicateService
        from apps.pqm.services.notification_service import NotificationService

        validate_before_photos_on_submit(nc)
        validate_nc_transition(nc, NCStatus.SUBMITTED)

        # Duplicate check — soft warning, does not block
        similar = DuplicateService.find_similar_ncs(nc)
        duplicate_warning = similar.exists()

        with transaction.atomic():
            if not nc.nc_number:
                nc.nc_number = NumberingService.generate_nc_number(
                    nc.project,
                    series=nc.series or NCSeries.LIVE,
                )
            NCService.transition_status(nc, NCStatus.SUBMITTED, user_id)

        NotificationService.send_nc_event(nc, "nc_submitted")
        if nc.is_safety_critical:
            NotificationService.send_nc_event(nc, "nc_safety_critical")

        nc._duplicate_warning = duplicate_warning  # type: ignore[attr-defined]
        return nc

    @staticmethod
    def transition_status(
        nc: "NonConformance",  # type: ignore[name-defined]
        target_status: str,
        actor_id: uuid.UUID,
        reason: str = "",
        metadata: dict | None = None,
    ) -> "NonConformance":  # type: ignore[name-defined]
        from apps.pqm.models.status_history import PQMStatusHistory

        validate_nc_transition(nc, target_status)

        old_status = nc.status
        nc.status = target_status
        nc.updated_by_id = actor_id

        if target_status == NCStatus.CLOSED:
            nc.actual_closure_date = timezone.now().date()
        elif target_status == NCStatus.REOPENED:
            nc.reopen_count += 1
            nc.actual_closure_date = None

        nc.save()

        PQMStatusHistory.objects.create(
            organization_id=nc.organization_id,
            business_unit_id=nc.business_unit_id,
            nc=nc,
            event_type="StatusChanged",
            from_status=old_status,
            to_status=target_status,
            actor_id=actor_id,
            reason=reason,
            metadata=metadata or {},
        )
        return nc

    @staticmethod
    def assign_nc(
        nc: "NonConformance",  # type: ignore[name-defined]
        assignee_id: uuid.UUID,
        actor_id: uuid.UUID,
    ) -> "NonConformance":  # type: ignore[name-defined]
        from apps.pqm.models.status_history import PQMStatusHistory
        from apps.pqm.services.notification_service import NotificationService

        old_assignee = nc.assigned_to_id
        nc.assigned_to_id = assignee_id
        nc.updated_by_id = actor_id
        nc.save(update_fields=["assigned_to_id", "updated_by_id", "updated_at"])

        if nc.status == NCStatus.APPROVED:
            NCService.transition_status(nc, NCStatus.ASSIGNED, actor_id)
        else:
            # Reassignment during existing flow
            PQMStatusHistory.objects.create(
                organization_id=nc.organization_id,
                business_unit_id=nc.business_unit_id,
                nc=nc,
                event_type="Reassigned",
                from_status=nc.status,
                to_status=nc.status,
                actor_id=actor_id,
                metadata={"old_assignee": str(old_assignee), "new_assignee": str(assignee_id)},
            )

        NotificationService.send_nc_event(nc, "nc_assigned")
        return nc

    @staticmethod
    def soft_delete_nc(nc: "NonConformance", actor_id: uuid.UUID) -> None:  # type: ignore[name-defined]
        from apps.pqm.models import (
            PQMAttachment, PQMApprovalStep, PQMComment,
        )
        from apps.pqm.models.status_history import PQMStatusHistory

        with transaction.atomic():
            nc.soft_delete(deleted_by_id=actor_id)
            # Cascade soft-delete all child rows
            now = timezone.now()
            for model in [PQMAttachment, PQMApprovalStep, PQMComment, PQMStatusHistory]:
                model.objects.filter(nc=nc).update(
                    is_deleted=True, deleted_at=now, deleted_by_id=actor_id, is_active=False
                )

    @staticmethod
    def _calculate_target_date(
        organization_id: uuid.UUID,
        bu_id: uuid.UUID,
        priority: str,
        is_safety_critical: bool,
    ):
        from apps.pqm.models.escalation_config import PQMEscalationConfig
        from datetime import date, timedelta

        if is_safety_critical:
            return date.today() + timedelta(days=1)  # 24-hour SLA

        # Try tenant config first
        try:
            cfg = PQMEscalationConfig.objects.get(
                organization_id=organization_id,
                business_unit_id=bu_id,
                priority=priority,
            )
            return date.today() + timedelta(days=cfg.sla_days)
        except PQMEscalationConfig.DoesNotExist:
            pass

        default_days = Priority.default_sla_days().get(priority, 10)
        return date.today() + timedelta(days=default_days)
