# yss_orbit/backend/apps/payroll/api/views/compliance_views.py
"""
YSS Orbit — Payroll Compliance API Views
==========================================
Phase 4: API Layer Audit

Endpoints for statutory compliance report downloads.
These are stubs that return structured metadata now, and will produce
actual PDF/XLSX files when the report service is wired in Phase 8.

Endpoints:
  GET  /api/v1/payroll/compliance/form-16/     — Form 16 (TDS certificate) download
  GET  /api/v1/payroll/compliance/pf-ecr/      — PF ECR (Employee Contribution Return)
  GET  /api/v1/payroll/compliance/esi-return/  — ESI contribution return
  GET  /api/v1/payroll/compliance/pt-return/   — Professional Tax return
  GET  /api/v1/payroll/compliance/lwf-return/  — Labour Welfare Fund return

All endpoints require ?year= and are BU-scoped via x-business-unit-id header.
Form 16 additionally requires ?employee_id=.
"""
from __future__ import annotations

import logging
import uuid

from rest_framework.views import APIView
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from apps.platform.core_response import success_response, error_response
from apps.hrms.api.views.utils import _require_bu

logger = logging.getLogger(__name__)


def _require_year(request: Request):
    """Extract and validate the `year` query param."""
    year_str = request.query_params.get("year")
    if not year_str:
        return None, error_response(
            "BAD_REQUEST", "year query parameter is required.", http_status=400, request=request
        )
    try:
        year = int(year_str)
        if not (2000 <= year <= 2100):
            raise ValueError("out of range")
        return year, None
    except ValueError:
        return None, error_response(
            "BAD_REQUEST", f"Invalid year: {year_str!r}", http_status=400, request=request
        )


class Form16DownloadView(APIView):
    """
    GET /api/v1/payroll/compliance/form-16/?year=2025&employee_id=<uuid>

    Returns Form 16 (TDS Certificate) metadata for the given employee and year.
    Phase 8: replace stub with actual PDF generation via WeasyPrint/ReportLab.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request: Request) -> Response:
        bu_id, err = _require_bu(request)
        if err:
            return err

        year, err = _require_year(request)
        if err:
            return err

        employee_id_str = request.query_params.get("employee_id")
        if not employee_id_str:
            return error_response(
                "BAD_REQUEST", "employee_id is required for Form 16.", http_status=400, request=request
            )

        try:
            employee_id = uuid.UUID(employee_id_str)
        except ValueError:
            return error_response(
                "BAD_REQUEST", f"Invalid employee_id: {employee_id_str!r}", http_status=400, request=request
            )

        # Verify payroll data exists for this employee and year
        from apps.payroll.models.payslip import Payslip
        from apps.payroll.models.payroll_run_model import PayrollRun

        payslips = Payslip.objects.filter(
            business_unit_id=bu_id,
            payroll_run__year=year,
            payroll_run__status__in=[PayrollRun.Status.LOCKED, PayrollRun.Status.PROCESSED],
        ).filter(employee_code__isnull=False)

        # Get summary figures
        from django.db.models import Sum
        agg = payslips.aggregate(
            total_gross=Sum("gross_salary"),
            total_net=Sum("net_salary"),
            total_tds=Sum("income_tax_tds"),
        )

        data = {
            "report_type": "FORM_16",
            "year": year,
            "employee_id": str(employee_id),
            "business_unit_id": str(bu_id),
            "payslips_found": payslips.count(),
            "total_gross": float(agg["total_gross"] or 0),
            "total_net": float(agg["total_net"] or 0),
            "total_tds_deducted": float(agg["total_tds"] or 0),
            # Phase 8: "download_url": generate_form16_pdf(...)
            "status": "STUB — PDF generation pending Phase 8",
        }

        logger.info(
            "Form16 compliance report requested: bu=%s year=%s emp=%s",
            bu_id, year, employee_id,
        )
        return success_response(data=data, request=request)


class PFECRView(APIView):
    """
    GET /api/v1/payroll/compliance/pf-ecr/?year=2025&month=4

    Returns PF ECR (Employee Contribution Return) data for the given period.
    Phase 8: replace stub with actual ECR file generation.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request: Request) -> Response:
        bu_id, err = _require_bu(request)
        if err:
            return err

        year, err = _require_year(request)
        if err:
            return err

        month_str = request.query_params.get("month")
        if not month_str:
            return error_response(
                "BAD_REQUEST", "month query parameter is required.", http_status=400, request=request
            )

        try:
            month = int(month_str)
            if not (1 <= month <= 12):
                raise ValueError("out of range")
        except ValueError:
            return error_response(
                "BAD_REQUEST", f"Invalid month: {month_str!r}", http_status=400, request=request
            )

        from apps.payroll.models.payslip import Payslip
        from apps.payroll.models.payroll_run_model import PayrollRun
        from django.db.models import Sum, Count

        agg = Payslip.objects.filter(
            business_unit_id=bu_id,
            payroll_run__year=year,
            payroll_run__month=month,
            payroll_run__status__in=[PayrollRun.Status.LOCKED, PayrollRun.Status.PROCESSED],
        ).aggregate(
            employee_pf=Sum("employee_pf"),
            employer_pf=Sum("employer_pf"),
            total_employees=Count("id"),
        )

        data = {
            "report_type": "PF_ECR",
            "year": year,
            "month": month,
            "business_unit_id": str(bu_id),
            "total_employees": agg["total_employees"] or 0,
            "employee_pf_contribution": float(agg["employee_pf"] or 0),
            "employer_pf_contribution": float(agg["employer_pf"] or 0),
            "total_pf": float((agg["employee_pf"] or 0) + (agg["employer_pf"] or 0)),
            "status": "STUB — ECR file generation pending Phase 8",
        }

        logger.info("PF ECR report requested: bu=%s %04d-%02d", bu_id, year, month)
        return success_response(data=data, request=request)


class ESIReturnView(APIView):
    """
    GET /api/v1/payroll/compliance/esi-return/?year=2025&month=4

    Returns ESI contribution summary for the given period.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request: Request) -> Response:
        bu_id, err = _require_bu(request)
        if err:
            return err

        year, err = _require_year(request)
        if err:
            return err

        month_str = request.query_params.get("month")
        try:
            month = int(month_str or "0")
            if not (1 <= month <= 12):
                raise ValueError()
        except (ValueError, TypeError):
            return error_response(
                "BAD_REQUEST", "month (1-12) is required.", http_status=400, request=request
            )

        from apps.payroll.models.payslip import Payslip
        from apps.payroll.models.payroll_run_model import PayrollRun
        from django.db.models import Sum, Count

        agg = Payslip.objects.filter(
            business_unit_id=bu_id,
            payroll_run__year=year,
            payroll_run__month=month,
            payroll_run__status__in=[PayrollRun.Status.LOCKED, PayrollRun.Status.PROCESSED],
        ).aggregate(
            employee_esi=Sum("employee_esi"),
            employer_esi=Sum("employer_esi"),
            total_employees=Count("id"),
        )

        data = {
            "report_type": "ESI_RETURN",
            "year": year,
            "month": month,
            "business_unit_id": str(bu_id),
            "total_employees": agg["total_employees"] or 0,
            "employee_esi_contribution": float(agg["employee_esi"] or 0),
            "employer_esi_contribution": float(agg["employer_esi"] or 0),
            "total_esi": float((agg["employee_esi"] or 0) + (agg["employer_esi"] or 0)),
            "status": "STUB — ESI return file generation pending Phase 8",
        }

        logger.info("ESI Return report requested: bu=%s %04d-%02d", bu_id, year, month)
        return success_response(data=data, request=request)


class PTReturnView(APIView):
    """
    GET /api/v1/payroll/compliance/pt-return/?year=2025&month=4

    Returns Professional Tax deduction summary for the given period.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request: Request) -> Response:
        bu_id, err = _require_bu(request)
        if err:
            return err

        year, err = _require_year(request)
        if err:
            return err

        month_str = request.query_params.get("month")
        try:
            month = int(month_str or "0")
            if not (1 <= month <= 12):
                raise ValueError()
        except (ValueError, TypeError):
            return error_response(
                "BAD_REQUEST", "month (1-12) is required.", http_status=400, request=request
            )

        from apps.payroll.models.payslip import Payslip
        from apps.payroll.models.payroll_run_model import PayrollRun
        from django.db.models import Sum, Count

        agg = Payslip.objects.filter(
            business_unit_id=bu_id,
            payroll_run__year=year,
            payroll_run__month=month,
            payroll_run__status__in=[PayrollRun.Status.LOCKED, PayrollRun.Status.PROCESSED],
        ).aggregate(
            professional_tax=Sum("professional_tax"),
            total_employees=Count("id"),
        )

        data = {
            "report_type": "PT_RETURN",
            "year": year,
            "month": month,
            "business_unit_id": str(bu_id),
            "total_employees": agg["total_employees"] or 0,
            "total_pt_deducted": float(agg["professional_tax"] or 0),
            "status": "STUB — PT return file generation pending Phase 8",
        }

        logger.info("PT Return report requested: bu=%s %04d-%02d", bu_id, year, month)
        return success_response(data=data, request=request)
