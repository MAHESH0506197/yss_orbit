"""
YSS Orbit — Onboarding Service (v2 — field-aligned)

Manages the complete employee onboarding workflow.
Field mapping aligned to the actual OnboardingTemplate/Task/EmployeeOnboarding
model schema as defined in apps/hrms/models/onboarding.py.
"""
from __future__ import annotations

import uuid
import logging
from datetime import date, timedelta
from decimal import Decimal

from django.db import transaction
from django.utils import timezone

from apps.hrms.models.onboarding import (
    OnboardingTemplate, OnboardingTask,
    EmployeeOnboarding, OnboardingTaskCompletion,
)
from apps.hrms.models.employee import Employee
from apps.hrms.services.lifecycle_event_publisher import LifecycleEventPublisher

logger = logging.getLogger(__name__)


class OnboardingError(Exception):
    pass


class OnboardingService:
    """
    Drives the employee onboarding lifecycle.

    Typical flow:
        1. HR creates employee
        2. OnboardingService.initialize(employee_id, template_id) → EmployeeOnboarding
        3. Tasks completed via complete_task()
        4. When all blocking tasks done → Employee.status → ACTIVE automatically
    """

    @classmethod
    @transaction.atomic
    def initialize(
        cls,
        bu_id: uuid.UUID,
        employee_id: uuid.UUID,
        template_id: uuid.UUID,
        initiated_by_id: uuid.UUID,
        start_date: date | None = None,
    ) -> EmployeeOnboarding:
        """
        Initialize onboarding for an employee from a template.
        Creates EmployeeOnboarding + one OnboardingTaskCompletion per template task.
        """
        try:
            template = OnboardingTemplate.objects.get(
                id=template_id, business_unit_id=bu_id, is_active=True
            )
        except OnboardingTemplate.DoesNotExist:
            raise OnboardingError(f"Onboarding template {template_id} not found or inactive.")

        if EmployeeOnboarding.objects.filter(
            business_unit_id=bu_id, employee_id=employee_id
        ).exists():
            raise OnboardingError(
                f"Onboarding already exists for employee {employee_id}."
            )

        tasks = list(OnboardingTask.objects.filter(
            template=template
        ).order_by("sort_order", "due_days_from_joining"))

        today = start_date or date.today()
        expected_completion = today + timedelta(days=template.estimated_days)

        onboarding = EmployeeOnboarding.objects.create(
            business_unit_id=bu_id,
            employee_id=employee_id,
            template=template,
            status=EmployeeOnboarding.Status.IN_PROGRESS,
            start_date=today,
            expected_completion_date=expected_completion,
            completion_percentage=Decimal("0"),
        )

        for task in tasks:
            due_date = today + timedelta(days=task.due_days_from_joining) if task.due_days_from_joining else None
            OnboardingTaskCompletion.objects.create(
                business_unit_id=bu_id,
                onboarding=onboarding,
                task=task,
                status=OnboardingTaskCompletion.Status.PENDING,
                due_date=due_date,
            )

        LifecycleEventPublisher.onboarding_started(
            employee_id=employee_id, bu_id=bu_id,
            template_name=template.name,
            task_count=len(tasks),
            actor_id=initiated_by_id,
            reference_id=onboarding.id,
        )

        logger.info("Onboarding initialized", extra={
            "employee_id": str(employee_id),
            "template": template.name,
            "task_count": len(tasks),
        })
        return onboarding

    @classmethod
    @transaction.atomic
    def complete_task(
        cls,
        bu_id: uuid.UUID,
        onboarding_id: uuid.UUID,
        task_completion_id: uuid.UUID,
        completed_by_id: uuid.UUID,
        notes: str = "",
    ) -> OnboardingTaskCompletion:
        """
        Mark an individual onboarding task as completed.
        Auto-recalculates completion percentage and checks blocking gates.
        """
        try:
            onboarding = EmployeeOnboarding.objects.select_for_update().get(
                id=onboarding_id, business_unit_id=bu_id,
                status=EmployeeOnboarding.Status.IN_PROGRESS,
            )
        except EmployeeOnboarding.DoesNotExist:
            raise OnboardingError(f"Active onboarding {onboarding_id} not found.")

        try:
            task_completion = OnboardingTaskCompletion.objects.get(
                id=task_completion_id,
                onboarding=onboarding,
                status=OnboardingTaskCompletion.Status.PENDING,
            )
        except OnboardingTaskCompletion.DoesNotExist:
            raise OnboardingError(f"Task {task_completion_id} not found or already completed.")

        task_completion.status = OnboardingTaskCompletion.Status.COMPLETED
        task_completion.completed_by_id = completed_by_id
        task_completion.completed_at = timezone.now()
        task_completion.notes = notes
        task_completion.save(update_fields=["status", "completed_by_id", "completed_at", "notes", "updated_at"])

        # Recompute percentage
        total = OnboardingTaskCompletion.objects.filter(onboarding=onboarding).count()
        completed = OnboardingTaskCompletion.objects.filter(
            onboarding=onboarding, status=OnboardingTaskCompletion.Status.COMPLETED
        ).count()
        pct = Decimal(str(round(completed / total * 100, 2))) if total else Decimal("0")

        onboarding.completion_percentage = pct
        onboarding.save(update_fields=["completion_percentage", "updated_at"])

        # Check if all BLOCKING tasks are done
        blocking_pending = OnboardingTaskCompletion.objects.filter(
            onboarding=onboarding,
            status=OnboardingTaskCompletion.Status.PENDING,
            task__is_blocking=True,
        ).count()

        if blocking_pending == 0 and completed == total:
            cls._mark_onboarding_complete(onboarding, completed_by_id)
        elif blocking_pending == 0:
            cls._activate_employee(bu_id, onboarding.employee_id, completed_by_id)

        return task_completion

    @classmethod
    def _mark_onboarding_complete(
        cls,
        onboarding: EmployeeOnboarding,
        completed_by_id: uuid.UUID,
    ) -> None:
        onboarding.status = EmployeeOnboarding.Status.COMPLETED
        onboarding.completed_at = timezone.now()
        onboarding.completion_percentage = Decimal("100.00")
        onboarding.save(update_fields=["status", "completed_at", "completion_percentage", "updated_at"])

        cls._activate_employee(
            onboarding.business_unit_id, onboarding.employee_id, completed_by_id
        )

        LifecycleEventPublisher.onboarding_completed(
            employee_id=onboarding.employee_id,
            bu_id=onboarding.business_unit_id,
            actor_id=completed_by_id,
            reference_id=onboarding.id,
        )

    @staticmethod
    def _activate_employee(
        bu_id: uuid.UUID,
        employee_id: uuid.UUID,
        actor_id: uuid.UUID,
    ) -> None:
        """Set employee status ACTIVE when onboarding blocking gates are cleared."""
        Employee.objects.filter(
            id=employee_id, business_unit_id=bu_id,
            employment_status__in=[
                Employee.EmploymentStatus.ON_LEAVE,
                Employee.EmploymentStatus.NOTICE_PERIOD,
            ]
        ).update(employment_status=Employee.EmploymentStatus.ACTIVE)

    @staticmethod
    def get_onboarding_progress(
        bu_id: uuid.UUID, employee_id: uuid.UUID
    ) -> dict:
        """Returns onboarding progress summary for the Employee 360 view."""
        try:
            onboarding = EmployeeOnboarding.objects.get(
                business_unit_id=bu_id, employee_id=employee_id
            )
        except EmployeeOnboarding.DoesNotExist:
            return {"status": "NOT_STARTED", "progress": 0}

        tasks = OnboardingTaskCompletion.objects.filter(
            onboarding=onboarding
        ).select_related("task").order_by("task__sort_order")

        total = tasks.count()
        completed = tasks.filter(status=OnboardingTaskCompletion.Status.COMPLETED).count()

        return {
            "onboarding_id": str(onboarding.id),
            "status": onboarding.status,
            "template": onboarding.template.name,
            "total_tasks": total,
            "completed_tasks": completed,
            "completion_percentage": float(onboarding.completion_percentage),
            "tasks": [
                {
                    "id": str(tc.id),
                    "title": tc.task.title,
                    "task_type": tc.task.task_type,
                    "is_blocking": tc.task.is_blocking,
                    "assigned_to_role": tc.task.assigned_to_role,
                    "status": tc.status,
                    "due_date": tc.due_date.isoformat() if tc.due_date else None,
                    "completed_at": tc.completed_at.isoformat() if tc.completed_at else None,
                }
                for tc in tasks
            ],
        }
