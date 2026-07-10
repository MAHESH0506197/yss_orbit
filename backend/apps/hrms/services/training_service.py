"""
YSS Orbit — Training Service (v2 — field-aligned)

Field mapping aligned to actual TrainingCourse/EmployeeTraining model schema
as defined in apps/hrms/models/training.py:
  - TrainingCourse.title (not name)
  - TrainingCourse.course_type (not category)
  - EmployeeTraining.pass_mark (not passing_score on course)
  - EmployeeTraining.enrollment_date (not enrolled_on)
  - EmployeeTraining.nominated_by_id (not enrolled_by_id)
  - EmployeeTraining.remarks (not completion_notes)
"""
from __future__ import annotations

import uuid
import logging
from datetime import date
from typing import Optional

from django.db import transaction

from apps.hrms.models.training import TrainingCourse, EmployeeTraining
from apps.hrms.services.lifecycle_event_publisher import LifecycleEventPublisher

logger = logging.getLogger(__name__)


class TrainingError(Exception):
    pass


class TrainingService:
    """
    Manages employee learning and development lifecycle.

    Typical flow:
        1. HR/Manager nominates employee → enroll()
        2. Employee attends training
        3. HR marks completion → complete()
        4. Certificate issued on completion
    """

    @staticmethod
    @transaction.atomic
    def enroll(
        bu_id: uuid.UUID,
        course_id: uuid.UUID,
        employee_id: uuid.UUID,
        enrolled_by_id: uuid.UUID,
        scheduled_date: Optional[date] = None,
        pass_mark: Optional[float] = None,
        notes: str = "",
    ) -> EmployeeTraining:
        """
        Enroll an employee in a training course.
        Prevents duplicate active enrollments for the same course.
        """
        try:
            course = TrainingCourse.objects.get(
                id=course_id, business_unit_id=bu_id,
                status=TrainingCourse.Status.PUBLISHED,
            )
        except TrainingCourse.DoesNotExist:
            raise TrainingError(f"Course {course_id} not found or not published.")

        # Prevent duplicate active enrollment
        if EmployeeTraining.objects.filter(
            business_unit_id=bu_id,
            course=course,
            employee_id=employee_id,
            status__in=[
                EmployeeTraining.Status.ENROLLED,
                EmployeeTraining.Status.IN_PROGRESS,
                EmployeeTraining.Status.NOMINATED,
            ]
        ).exists():
            raise TrainingError(
                f"Employee is already enrolled in '{course.title}'."
            )

        enrollment = EmployeeTraining.objects.create(
            business_unit_id=bu_id,
            course=course,
            employee_id=employee_id,
            status=EmployeeTraining.Status.ENROLLED,
            nominated_by_id=enrolled_by_id,
            enrollment_date=date.today(),
            start_date=scheduled_date,
            pass_mark=pass_mark,
            remarks=notes,
        )

        LifecycleEventPublisher.training_enrolled(
            employee_id=employee_id, bu_id=bu_id,
            course_name=course.title,
            actor_id=enrolled_by_id,
            reference_id=enrollment.id,
        )

        logger.info("Training enrollment created", extra={
            "enrollment_id": str(enrollment.id),
            "employee_id": str(employee_id),
            "course": course.title,
        })
        return enrollment

    @staticmethod
    @transaction.atomic
    def mark_in_progress(
        bu_id: uuid.UUID,
        enrollment_id: uuid.UUID,
    ) -> EmployeeTraining:
        """Mark training as IN_PROGRESS when employee starts."""
        try:
            enrollment = EmployeeTraining.objects.select_for_update().get(
                id=enrollment_id, business_unit_id=bu_id,
                status__in=[EmployeeTraining.Status.ENROLLED, EmployeeTraining.Status.NOMINATED],
            )
        except EmployeeTraining.DoesNotExist:
            raise TrainingError(f"Enrollment {enrollment_id} not found.")

        enrollment.status = EmployeeTraining.Status.IN_PROGRESS
        enrollment.save(update_fields=["status", "updated_at"])
        return enrollment

    @staticmethod
    @transaction.atomic
    def complete(
        bu_id: uuid.UUID,
        enrollment_id: uuid.UUID,
        completed_by_id: uuid.UUID,
        completion_date: date,
        score: Optional[float] = None,
        certificate_number: str = "",
        certificate_url: str = "",
        expires_on: Optional[date] = None,
        notes: str = "",
    ) -> EmployeeTraining:
        """
        Mark training as COMPLETED or FAILED (based on pass_mark).
        """
        try:
            enrollment = EmployeeTraining.objects.select_for_update().get(
                id=enrollment_id, business_unit_id=bu_id,
                status__in=[
                    EmployeeTraining.Status.ENROLLED,
                    EmployeeTraining.Status.IN_PROGRESS,
                    EmployeeTraining.Status.NOMINATED,
                ]
            )
        except EmployeeTraining.DoesNotExist:
            raise TrainingError(f"Active enrollment {enrollment_id} not found.")

        passed = True
        if score is not None and enrollment.pass_mark is not None:
            passed = score >= float(enrollment.pass_mark)

        enrollment.status = (
            EmployeeTraining.Status.COMPLETED if passed
            else EmployeeTraining.Status.FAILED
        )
        enrollment.completion_date = completion_date
        enrollment.score = score
        enrollment.certificate_number = certificate_number
        enrollment.certificate_url = certificate_url
        enrollment.expires_on = expires_on
        enrollment.remarks = notes
        enrollment.save(update_fields=[
            "status", "completion_date", "score",
            "certificate_number", "certificate_url", "expires_on", "remarks", "updated_at",
        ])

        if passed:
            LifecycleEventPublisher.training_completed(
                employee_id=enrollment.employee_id, bu_id=bu_id,
                course_name=enrollment.course.title,
                score=score,
                actor_id=completed_by_id,
                reference_id=enrollment.id,
            )

            if certificate_number or certificate_url:
                LifecycleEventPublisher.publish(
                    employee_id=enrollment.employee_id,
                    business_unit_id=bu_id,
                    event_type="CERTIFICATION_EARNED",
                    title=f"Certificate earned: {enrollment.course.title}",
                    metadata={"course": enrollment.course.title, "score": score},
                    actor_id=completed_by_id,
                    reference_id=enrollment.id,
                )

        logger.info("Training completed", extra={
            "enrollment_id": str(enrollment_id),
            "employee_id": str(enrollment.employee_id),
            "passed": passed,
            "score": score,
        })
        return enrollment

    @staticmethod
    def get_employee_training_history(
        bu_id: uuid.UUID, employee_id: uuid.UUID
    ) -> list[dict]:
        """Returns all training records for an employee (for 360 view)."""
        trainings = EmployeeTraining.objects.filter(
            business_unit_id=bu_id, employee_id=employee_id
        ).select_related("course").order_by("-enrollment_date")

        return [
            {
                "enrollment_id": str(t.id),
                "course_title": t.course.title,
                "course_type": t.course.course_type,
                "status": t.status,
                "enrollment_date": t.enrollment_date.isoformat() if t.enrollment_date else None,
                "completion_date": t.completion_date.isoformat() if t.completion_date else None,
                "score": float(t.score) if t.score else None,
                "is_mandatory": t.course.is_mandatory,
                "expires_on": t.expires_on.isoformat() if t.expires_on else None,
            }
            for t in trainings
        ]

    @staticmethod
    def get_mandatory_training_gaps(bu_id: uuid.UUID) -> list[dict]:
        """
        Returns employees who haven't completed mandatory published training.
        Used for compliance reporting and auto-alerts.
        """
        from apps.hrms.models.employee import Employee

        mandatory_courses = TrainingCourse.objects.filter(
            business_unit_id=bu_id,
            is_mandatory=True,
            status=TrainingCourse.Status.PUBLISHED,
        )

        gaps = []
        for course in mandatory_courses:
            completed_employee_ids = set(
                EmployeeTraining.objects.filter(
                    business_unit_id=bu_id,
                    course=course,
                    status=EmployeeTraining.Status.COMPLETED,
                ).values_list("employee_id", flat=True)
            )

            missing_employees = Employee.objects.filter(
                business_unit_id=bu_id,
                employment_status=Employee.EmploymentStatus.ACTIVE,
            ).exclude(id__in=completed_employee_ids)

            for emp in missing_employees:
                gaps.append({
                    "employee_id": str(emp.id),
                    "employee_code": emp.employee_code,
                    "employee_name": emp.full_name,
                    "course_id": str(course.id),
                    "course_title": course.title,
                })

        return gaps
