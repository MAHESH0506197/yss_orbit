# YSS Orbit - Payroll Approval & Reports API Views
from __future__ import annotations
import uuid
import logging
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework import status, viewsets
from rest_framework.permissions import IsAuthenticated

from apps.payroll.services.payroll_approval_service import PayrollApprovalService, PayrollApprovalError
from apps.payroll.services.payroll_report_service import PayrollReportService
from apps.payroll.models.payroll_run_model import PayrollRun

logger = logging.getLogger(__name__)

class PayrollApprovalViewSet(viewsets.ViewSet):
    permission_classes = [IsAuthenticated]
    
    def _get_bu_id(self, request):
        if hasattr(request, "security_context") and request.security_context:
            bu_id = request.security_context.business_unit_id
        else:
            bu_id = request.headers.get("X-Business-Unit-Id")
        if not bu_id:
            raise ValueError("X-Business-Unit-Id header is required.")
        return bu_id

    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        bu_id = self._get_bu_id(request)
        svc = PayrollApprovalService()
        try:
            run = PayrollRun.objects.get(id=pk, business_unit_id=bu_id)
            svc.approve_run(run.id, request.user.id)
            return Response({"status": "approved"})
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'])
    def lock(self, request, pk=None):
        bu_id = self._get_bu_id(request)
        svc = PayrollApprovalService()
        try:
            run = PayrollRun.objects.get(id=pk, business_unit_id=bu_id)
            svc.lock_run(run.id, request.user.id)
            return Response({"status": "locked"})
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'])
    def rollback(self, request, pk=None):
        bu_id = self._get_bu_id(request)
        svc = PayrollApprovalService()
        try:
            run = PayrollRun.objects.get(id=pk, business_unit_id=bu_id)
            svc.rollback_run(run.id, request.user.id)
            return Response({"status": "rolled_back"})
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['get'], url_path='bank-statement')
    def bank_statement(self, request, pk=None):
        bu_id = self._get_bu_id(request)
        svc = PayrollReportService()
        data = svc.generate_bank_statement(pk, bu_id)
        return Response(data)

    @action(detail=True, methods=['get'], url_path='pf-esi-register')
    def pf_esi_register(self, request, pk=None):
        bu_id = self._get_bu_id(request)
        svc = PayrollReportService()
        data = svc.generate_pf_esi_register(pk, bu_id)
        return Response(data)

    @action(detail=True, methods=['get'], url_path='salary-register')
    def salary_register(self, request, pk=None):
        bu_id = self._get_bu_id(request)
        svc = PayrollReportService()
        data = svc.generate_salary_register(pk, bu_id)
        return Response(data)

    @action(detail=True, methods=['get'])
    def summary(self, request, pk=None):
        bu_id = self._get_bu_id(request)
        svc = PayrollReportService()
        data = svc.generate_summary(pk, bu_id)
        return Response(data)
