"""
YSS Orbit — Lifecycle Event Publisher

The single source of truth for creating EmployeeEvent timeline entries.
Every significant HR action MUST call this publisher — it ensures
the Employee 360 Timeline is always consistent and auditable.

Events are created atomically within the same transaction as the
action that triggers them. No async — the event is part of the
business transaction, not a notification.

Usage:
    from apps.hrms.services.lifecycle_event_publisher import LifecycleEventPublisher
    LifecycleEventPublisher.publish(
        employee_id=employee.id,
        business_unit_id=bu_id,
        event_type=EmployeeEvent.EventType.PROMOTED,
        title="Promoted to Senior Engineer",
        description="Performance-based promotion in FY2025-26 annual cycle",
        metadata={"from": "Engineer", "to": "Senior Engineer", "increment_pct": 18},
        actor_id=approved_by_id,
        reference_id=promotion.id,
    )
"""
from __future__ import annotations

import uuid
import logging
from datetime import date
from typing import Any

from django.utils.timezone import now as django_now

from apps.hrms.models.employee_event import EmployeeEvent

logger = logging.getLogger(__name__)


class LifecycleEventPublisher:
    """
    Creates EmployeeEvent entries for the Employee 360 Timeline.
    All HRMS services must route through this publisher — no direct
    EmployeeEvent.objects.create() in service code outside this class.
    """

    @staticmethod
    def publish(
        employee_id: uuid.UUID,
        business_unit_id: uuid.UUID,
        event_type: str,
        title: str,
        description: str = "",
        metadata: dict[str, Any] | None = None,
        actor_id: uuid.UUID | None = None,
        reference_id: uuid.UUID | None = None,
        event_date: date | None = None,
    ) -> EmployeeEvent:
        """
        Create and persist an EmployeeEvent.

        Args:
            employee_id: UUID of the affected employee.
            business_unit_id: BU scope.
            event_type: One of EmployeeEvent.EventType choices.
            title: One-line summary for the 360 Timeline card.
            description: Optional detail text (shown in expanded view).
            metadata: Optional structured data for drill-down views.
            actor_id: UUID of the user who triggered the action.
            reference_id: UUID of the linked record (e.g. promotion.id).
            event_date: Date of the event (defaults to today).
        """
        event = EmployeeEvent.objects.create(
            business_unit_id=business_unit_id,
            employee_id=employee_id,
            event_type=event_type,
            event_date=event_date or django_now().date(),
            title=title,
            description=description,
            metadata=metadata or {},
            triggered_by_id=actor_id,
            reference_id=reference_id,
        )
        logger.debug(
            "EmployeeEvent published",
            extra={
                "employee_id": str(employee_id),
                "event_type": event_type,
                "event_id": str(event.id),
            }
        )
        return event

    # ── Shorthand factory methods for common events ───────────────────────────

    @staticmethod
    def hired(
        employee_id: uuid.UUID, bu_id: uuid.UUID,
        designation: str, department: str,
        actor_id: uuid.UUID | None = None,
        event_date: date | None = None,
    ) -> EmployeeEvent:
        return LifecycleEventPublisher.publish(
            employee_id=employee_id, business_unit_id=bu_id,
            event_type=EmployeeEvent.EventType.HIRED,
            title=f"Joined as {designation} in {department}",
            metadata={"designation": designation, "department": department},
            actor_id=actor_id, event_date=event_date,
        )

    @staticmethod
    def promoted(
        employee_id: uuid.UUID, bu_id: uuid.UUID,
        from_designation: str, to_designation: str,
        increment_pct: float,
        actor_id: uuid.UUID | None = None,
        reference_id: uuid.UUID | None = None,
        event_date: date | None = None,
    ) -> EmployeeEvent:
        return LifecycleEventPublisher.publish(
            employee_id=employee_id, business_unit_id=bu_id,
            event_type=EmployeeEvent.EventType.PROMOTED,
            title=f"Promoted: {from_designation} → {to_designation}",
            description=f"+{increment_pct:.1f}% increment",
            metadata={"from": from_designation, "to": to_designation, "increment_pct": increment_pct},
            actor_id=actor_id, reference_id=reference_id, event_date=event_date,
        )

    @staticmethod
    def transferred(
        employee_id: uuid.UUID, bu_id: uuid.UUID,
        from_dept: str, to_dept: str,
        actor_id: uuid.UUID | None = None,
        reference_id: uuid.UUID | None = None,
        event_date: date | None = None,
    ) -> EmployeeEvent:
        return LifecycleEventPublisher.publish(
            employee_id=employee_id, business_unit_id=bu_id,
            event_type=EmployeeEvent.EventType.TRANSFERRED,
            title=f"Transferred: {from_dept} → {to_dept}",
            metadata={"from_department": from_dept, "to_department": to_dept},
            actor_id=actor_id, reference_id=reference_id, event_date=event_date,
        )

    @staticmethod
    def resigned(
        employee_id: uuid.UUID, bu_id: uuid.UUID,
        last_working_date: str,
        actor_id: uuid.UUID | None = None,
        reference_id: uuid.UUID | None = None,
        event_date: date | None = None,
    ) -> EmployeeEvent:
        return LifecycleEventPublisher.publish(
            employee_id=employee_id, business_unit_id=bu_id,
            event_type=EmployeeEvent.EventType.EXIT_INITIATED,
            title=f"Resignation accepted — entering notice period",
            description=f"Last working date: {last_working_date}",
            metadata={"last_working_date": last_working_date},
            actor_id=actor_id, reference_id=reference_id, event_date=event_date,
        )

    @staticmethod
    def salary_revised(
        employee_id: uuid.UUID, bu_id: uuid.UUID,
        old_ctc: float, new_ctc: float, reason: str,
        actor_id: uuid.UUID | None = None,
        reference_id: uuid.UUID | None = None,
        event_date: date | None = None,
    ) -> EmployeeEvent:
        pct_change = ((new_ctc - old_ctc) / old_ctc * 100) if old_ctc else 0
        return LifecycleEventPublisher.publish(
            employee_id=employee_id, business_unit_id=bu_id,
            event_type=EmployeeEvent.EventType.SALARY_REVISED,
            title=f"Salary revised {pct_change:+.1f}%",
            description=reason,
            metadata={"old_ctc": old_ctc, "new_ctc": new_ctc, "reason": reason},
            actor_id=actor_id, reference_id=reference_id, event_date=event_date,
        )

    @staticmethod
    def confirmed(
        employee_id: uuid.UUID, bu_id: uuid.UUID,
        confirmation_date: str,
        actor_id: uuid.UUID | None = None,
        event_date: date | None = None,
    ) -> EmployeeEvent:
        return LifecycleEventPublisher.publish(
            employee_id=employee_id, business_unit_id=bu_id,
            event_type=EmployeeEvent.EventType.CONFIRMED,
            title=f"Confirmed as permanent employee",
            description=f"Confirmation date: {confirmation_date}",
            metadata={"confirmation_date": confirmation_date},
            actor_id=actor_id, event_date=event_date,
        )

    @staticmethod
    def onboarding_started(
        employee_id: uuid.UUID, bu_id: uuid.UUID,
        template_name: str, task_count: int,
        actor_id: uuid.UUID | None = None,
        reference_id: uuid.UUID | None = None,
    ) -> EmployeeEvent:
        return LifecycleEventPublisher.publish(
            employee_id=employee_id, business_unit_id=bu_id,
            event_type=EmployeeEvent.EventType.ONBOARDING_STARTED,
            title=f"Onboarding started — {task_count} tasks assigned",
            description=f"Template: {template_name}",
            metadata={"template": template_name, "task_count": task_count},
            actor_id=actor_id, reference_id=reference_id,
        )

    @staticmethod
    def onboarding_completed(
        employee_id: uuid.UUID, bu_id: uuid.UUID,
        actor_id: uuid.UUID | None = None,
        reference_id: uuid.UUID | None = None,
    ) -> EmployeeEvent:
        return LifecycleEventPublisher.publish(
            employee_id=employee_id, business_unit_id=bu_id,
            event_type=EmployeeEvent.EventType.ONBOARDING_DONE,
            title="All onboarding tasks completed",
            actor_id=actor_id, reference_id=reference_id,
        )

    @staticmethod
    def exit_initiated(
        employee_id: uuid.UUID, bu_id: uuid.UUID,
        exit_type: str, last_working_date: str,
        actor_id: uuid.UUID | None = None,
        reference_id: uuid.UUID | None = None,
    ) -> EmployeeEvent:
        return LifecycleEventPublisher.publish(
            employee_id=employee_id, business_unit_id=bu_id,
            event_type=EmployeeEvent.EventType.EXIT_INITIATED,
            title=f"Exit initiated ({exit_type}) — LWD: {last_working_date}",
            metadata={"exit_type": exit_type, "last_working_date": last_working_date},
            actor_id=actor_id, reference_id=reference_id,
        )

    @staticmethod
    def training_enrolled(
        employee_id: uuid.UUID, bu_id: uuid.UUID,
        course_name: str,
        actor_id: uuid.UUID | None = None,
        reference_id: uuid.UUID | None = None,
    ) -> EmployeeEvent:
        return LifecycleEventPublisher.publish(
            employee_id=employee_id, business_unit_id=bu_id,
            event_type=EmployeeEvent.EventType.TRAINING_ENROLLED,
            title=f"Enrolled in: {course_name}",
            metadata={"course": course_name},
            actor_id=actor_id, reference_id=reference_id,
        )

    @staticmethod
    def training_completed(
        employee_id: uuid.UUID, bu_id: uuid.UUID,
        course_name: str, score: float | None = None,
        actor_id: uuid.UUID | None = None,
        reference_id: uuid.UUID | None = None,
    ) -> EmployeeEvent:
        return LifecycleEventPublisher.publish(
            employee_id=employee_id, business_unit_id=bu_id,
            event_type=EmployeeEvent.EventType.TRAINING_COMPLETED,
            title=f"Completed: {course_name}",
            description=f"Score: {score}" if score is not None else "",
            metadata={"course": course_name, "score": score},
            actor_id=actor_id, reference_id=reference_id,
        )

    @staticmethod
    def asset_assigned(
        employee_id: uuid.UUID, bu_id: uuid.UUID,
        asset_name: str, asset_tag: str,
        actor_id: uuid.UUID | None = None,
        reference_id: uuid.UUID | None = None,
    ) -> EmployeeEvent:
        return LifecycleEventPublisher.publish(
            employee_id=employee_id, business_unit_id=bu_id,
            event_type=EmployeeEvent.EventType.ASSET_ASSIGNED,
            title=f"Asset assigned: {asset_name} ({asset_tag})",
            metadata={"asset_name": asset_name, "asset_tag": asset_tag},
            actor_id=actor_id, reference_id=reference_id,
        )

    @staticmethod
    def asset_returned(
        employee_id: uuid.UUID, bu_id: uuid.UUID,
        asset_name: str, asset_tag: str,
        actor_id: uuid.UUID | None = None,
        reference_id: uuid.UUID | None = None,
    ) -> EmployeeEvent:
        return LifecycleEventPublisher.publish(
            employee_id=employee_id, business_unit_id=bu_id,
            event_type=EmployeeEvent.EventType.ASSET_RETURNED,
            title=f"Asset returned: {asset_name} ({asset_tag})",
            metadata={"asset_name": asset_name, "asset_tag": asset_tag},
            actor_id=actor_id, reference_id=reference_id,
        )
