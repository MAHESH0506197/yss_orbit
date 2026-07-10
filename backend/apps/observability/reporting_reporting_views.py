# yss_orbit\backend\apps\reporting\reporting_views.py
"""
YSS Orbit — Reporting API Views
"""
import uuid
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.platform.core_response import success_response, error_response
from apps.observability.reporting_service import ReportingService
from apps.observability.serializers import ReportTemplateSerializer, ReportExecutionSerializer

_service = ReportingService()


def _get_bu_id(request: Request) -> uuid.UUID | None:
    bu_str = request.headers.get("X-Business-Unit-ID") or getattr(request.user, "business_unit_id", None)
    if bu_str:
        try:
            return uuid.UUID(str(bu_str))
        except (ValueError, TypeError):
            return None
    return None


class DashboardKPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request: Request) -> Response:
        bu_id = _get_bu_id(request)
        if not bu_id:
            return error_response("MISSING_BUSINESS_UNIT", "X-Business-Unit-ID header required.", http_status=400, request=request)
        
        data = _service.get_dashboard_kpis(bu_id)
        return success_response(data=data, request=request)


class SalesTrendView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request: Request) -> Response:
        bu_id = _get_bu_id(request)
        if not bu_id:
            return error_response("MISSING_BUSINESS_UNIT", "X-Business-Unit-ID header required.", http_status=400, request=request)
        
        days = int(request.query_params.get("days", 30))
        data = _service.get_sales_trends(bu_id, days=days)
        return success_response(data=data, request=request)

class ReportTemplateListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request: Request) -> Response:
        bu_id = _get_bu_id(request)
        if not bu_id:
            return error_response("MISSING_BUSINESS_UNIT", "X-Business-Unit-ID header required.", http_status=400, request=request)
        
        templates = _service.get_templates(bu_id)
        serializer = ReportTemplateSerializer(templates, many=True)
        return success_response(data=serializer.data, request=request)

    def post(self, request: Request) -> Response:
        bu_id = _get_bu_id(request)
        if not bu_id:
            return error_response("MISSING_BUSINESS_UNIT", "X-Business-Unit-ID header required.", http_status=400, request=request)
        
        serializer = ReportTemplateSerializer(data=request.data)
        if serializer.is_valid():
            created_by_id = getattr(request.user, "id", uuid.uuid4())
            template = _service.create_template(bu_id, serializer.validated_data, created_by_id)
            return success_response(data=ReportTemplateSerializer(template).data, status_code=status.HTTP_201_CREATED, request=request)
        return error_response("VALIDATION_ERROR", "Invalid data", details=serializer.errors, http_status=400, request=request)

class ReportExecutionView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request: Request, template_pk: str) -> Response:
        bu_id = _get_bu_id(request)
        if not bu_id:
            return error_response("MISSING_BUSINESS_UNIT", "X-Business-Unit-ID header required.", http_status=400, request=request)
        
        try:
            template_id = uuid.UUID(template_pk)
        except ValueError:
            return error_response("INVALID_ID", "Invalid template ID.", http_status=400, request=request)

        executions = _service.get_executions(bu_id, template_id)
        serializer = ReportExecutionSerializer(executions, many=True)
        return success_response(data=serializer.data, request=request)

    def post(self, request: Request, template_pk: str) -> Response:
        bu_id = _get_bu_id(request)
        if not bu_id:
            return error_response("MISSING_BUSINESS_UNIT", "X-Business-Unit-ID header required.", http_status=400, request=request)
        
        try:
            template_id = uuid.UUID(template_pk)
        except ValueError:
            return error_response("INVALID_ID", "Invalid template ID.", http_status=400, request=request)

        created_by_id = getattr(request.user, "id", uuid.uuid4())
        execution = _service.execute_report(bu_id, template_id, created_by_id)
        if not execution:
            return error_response("NOT_FOUND", "Report template not found.", http_status=404, request=request)
        
        return success_response(data=ReportExecutionSerializer(execution).data, status_code=status.HTTP_201_CREATED, request=request)
