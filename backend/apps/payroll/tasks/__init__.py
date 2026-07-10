# yss_orbit\backend\apps\payroll\tasks\__init__.py
"""
YSS Orbit — Payroll Tasks
Celery tasks for background processing of payroll.
"""
from __future__ import annotations

import logging
import uuid
from decimal import Decimal

from celery import shared_task
from django.db import transaction

from apps.payroll.models.payroll_run_model import PayrollRun
from apps.payroll.models.payslip import Payslip
from apps.platform.models import BackgroundJob

logger = logging.getLogger(__name__)

@shared_task(queue="queue_payroll")
def process_payroll_run(run_id_str: str, job_id_str: str, correlation_id: str):
    """
    Background task to compute payslips for all active employees for the given month/year.
    """
    try:
        run_id = uuid.UUID(run_id_str)
        job_id = uuid.UUID(job_id_str)
    except ValueError:
        logger.error("Invalid UUIDs passed to process_payroll_run")
        return

    # Mark Job as IN_PROGRESS
    BackgroundJob.objects.filter(id=job_id).update(
        status="IN_PROGRESS", progress_percent=0, progress_message="Initializing payroll run..."
    )

    try:
        run = PayrollRun.objects.get(id=run_id)
        run.status = PayrollRun.RunStatus.PROCESSING
        run.save(update_fields=["status", "updated_at"])

        # Fetch active employees for the BU (Simulated: requires HRMS integration)
        from apps.hrms.models import Employee
        employees = list(Employee.objects.filter(
            business_unit_id=run.business_unit_id, 
            is_active=True, 
            is_deleted=False
        ))

        total_emp = len(employees)
        if total_emp == 0:
            BackgroundJob.objects.filter(id=job_id).update(
                status="COMPLETED", progress_percent=100, progress_message="No active employees found."
            )
            run.status = PayrollRun.RunStatus.COMPLETED
            run.save(update_fields=["status", "updated_at"])
            return

        from apps.payroll.services.salary_computation_service import SalaryComputationService
        comp_service = SalaryComputationService()

        total_gross = Decimal("0")
        total_deductions = Decimal("0")
        total_net = Decimal("0")
        total_employer_pf = Decimal("0")
        total_employer_esi = Decimal("0")

        payslips_to_create = []

        for i, emp in enumerate(employees):
            # Fetch attendance and leave data (simulated with empty dicts for now)
            attendance_data = {}
            leave_data = {}

            # Compute payslip
            payslip = comp_service.compute_payslip(
                employee_id=emp.id,
                payroll_run=run,
                attendance_data=attendance_data,
                leave_data=leave_data,
                correlation_id=correlation_id,
            )
            payslips_to_create.append(payslip)

            total_gross += payslip.gross_salary
            total_deductions += payslip.total_deductions
            total_net += payslip.net_salary
            total_employer_pf += payslip.employer_pf
            total_employer_esi += payslip.employer_esi

            # Update progress every 10 employees
            if i % 10 == 0:
                pct = int((i / total_emp) * 100)
                BackgroundJob.objects.filter(id=job_id).update(
                    progress_percent=pct, progress_message=f"Processing {i}/{total_emp} employees"
                )

        # Bulk insert payslips
        with transaction.atomic():
            # Delete any existing draft payslips for this run (idempotency)
            Payslip.objects.filter(payroll_run=run).delete()
            Payslip.objects.bulk_create(payslips_to_create)

            # Update Run totals
            run.total_employees = total_emp
            run.total_gross = total_gross
            run.total_deductions = total_deductions
            run.total_net = total_net
            run.total_employer_pf = total_employer_pf
            run.total_employer_esi = total_employer_esi
            run.status = PayrollRun.RunStatus.COMPLETED
            run.save()

        # Update Job
        BackgroundJob.objects.filter(id=job_id).update(
            status="COMPLETED", progress_percent=100, progress_message="Payroll computation completed successfully."
        )

        from apps.platform.publisher import EventPublisher
        EventPublisher.publish(
            event_type="payroll.generated",
            payload={"run_id": str(run.id)},
            business_unit_id=run.business_unit_id,
            correlation_id=correlation_id,
        )

    except Exception as exc:
        logger.error(f"Payroll run failed: {exc}", exc_info=True)
        BackgroundJob.objects.filter(id=job_id).update(
            status="FAILED", progress_percent=0, progress_message=f"Failed: {str(exc)}"
        )
        try:
            run = PayrollRun.objects.get(id=run_id)
            run.status = PayrollRun.RunStatus.CANCELLED
            run.save(update_fields=["status", "updated_at"])
        except Exception:
            pass
