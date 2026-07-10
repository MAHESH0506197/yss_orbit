# yss_orbit\backend\apps\pqm\api\views\dashboard_views.py
from __future__ import annotations

from rest_framework.permissions import IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.platform.core_response import success_response, error_response
from apps.pqm.permissions import PQMPermission, IsProjectMember
from apps.pqm.services.dashboard_service import DashboardService
from apps.pqm.api.serializers.dashboard_serializer import DashboardSummarySerializer
from apps.pqm.api.views.utils import _require_bu, _get_org_id
import uuid

def is_valid_uuid(val):
    try:
        uuid.UUID(str(val))
        return True
    except ValueError:
        return False

class DashboardSummaryView(APIView):
    permission_classes = [IsAuthenticated, IsProjectMember]

    def get(self, request: Request) -> Response:
        bu_id, err = _require_bu(request)
        if err:
            return err
        if not PQMPermission.check_permission(request, PQMPermission.VIEW_DASHBOARD):
            return error_response("PQM_FORBIDDEN", "No permission to view dashboard.", http_status=403, request=request)

        org_id = _get_org_id(request)
        project_id = request.query_params.get("project")
        if not project_id:
            return error_response("PQM_VALIDATION_ERROR", "project parameter is required.", http_status=400, request=request)
        if not is_valid_uuid(project_id):
            return error_response("PQM_VALIDATION_ERROR", "Invalid project ID format.", http_status=400, request=request)

        kpi = DashboardService.get_kpi_summary(
            organization_id=org_id,
            business_unit_id=bu_id,
            project_id=project_id or None,
        )
        serializer = DashboardSummarySerializer(data=kpi)
        serializer.is_valid()
        return success_response(data=serializer.data, request=request)


class TrendAnalyticsView(APIView):
    permission_classes = [IsAuthenticated, IsProjectMember]

    def get(self, request: Request) -> Response:
        bu_id, err = _require_bu(request)
        if err:
            return err
        if not PQMPermission.check_permission(request, PQMPermission.VIEW_DASHBOARD):
            return error_response("PQM_FORBIDDEN", "No permission to view dashboard.", http_status=403, request=request)

        org_id = _get_org_id(request)
        project_id = request.query_params.get("project")
        if not project_id:
            return error_response("PQM_VALIDATION_ERROR", "project parameter is required.", http_status=400, request=request)
        if not is_valid_uuid(project_id):
            return error_response("PQM_VALIDATION_ERROR", "Invalid project ID format.", http_status=400, request=request)

        trends = DashboardService.get_trend_analytics(
            organization_id=org_id,
            business_unit_id=bu_id,
            project_id=project_id or None,
        )
        return success_response(data=trends, request=request)
