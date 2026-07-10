# yss_orbit\backend\apps\dashboard\views.py
import uuid
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.platform.core_response import success_response, error_response
from .serializers import DashboardSerializer, DashboardWidgetSerializer
from .services import DashboardService

_service = DashboardService()

def _get_bu_id(request: Request) -> uuid.UUID | None:
    bu_str = request.headers.get("X-Business-Unit-ID") or getattr(request.user, "business_unit_id", None)
    if bu_str:
        try:
            return uuid.UUID(str(bu_str))
        except (ValueError, TypeError):
            return None
    return None

class DashboardListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request: Request) -> Response:
        bu_id = _get_bu_id(request)
        if not bu_id:
            return error_response("MISSING_BUSINESS_UNIT", "X-Business-Unit-ID header required.", http_status=400, request=request)
        
        dashboards = _service.get_dashboards(bu_id)
        serializer = DashboardSerializer(dashboards, many=True)
        return success_response(data=serializer.data, request=request)

    def post(self, request: Request) -> Response:
        bu_id = _get_bu_id(request)
        if not bu_id:
            return error_response("MISSING_BUSINESS_UNIT", "X-Business-Unit-ID header required.", http_status=400, request=request)
        
        serializer = DashboardSerializer(data=request.data)
        if serializer.is_valid():
            created_by_id = getattr(request.user, "id", uuid.uuid4())
            dashboard = _service.create_dashboard(bu_id, serializer.validated_data, created_by_id)
            return success_response(data=DashboardSerializer(dashboard).data, status_code=status.HTTP_201_CREATED, request=request)
        return error_response("VALIDATION_ERROR", "Invalid data", details=serializer.errors, http_status=400, request=request)

class DashboardDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request: Request, pk: str) -> Response:
        bu_id = _get_bu_id(request)
        if not bu_id:
            return error_response("MISSING_BUSINESS_UNIT", "X-Business-Unit-ID header required.", http_status=400, request=request)
        
        try:
            if pk == "default":
                dashboard = _service.get_default_dashboard(bu_id)
            else:
                dashboard_id = uuid.UUID(pk)
                dashboard = _service.get_dashboard_by_id(bu_id, dashboard_id)
        except ValueError:
            return error_response("INVALID_ID", "Invalid dashboard ID.", http_status=400, request=request)

        if not dashboard:
            return error_response("NOT_FOUND", "Dashboard not found.", http_status=404, request=request)
        
        return success_response(data=DashboardSerializer(dashboard).data, request=request)

class DashboardWidgetView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request: Request, dashboard_pk: str) -> Response:
        bu_id = _get_bu_id(request)
        if not bu_id:
            return error_response("MISSING_BUSINESS_UNIT", "X-Business-Unit-ID header required.", http_status=400, request=request)
        
        try:
            dashboard_id = uuid.UUID(dashboard_pk)
        except ValueError:
            return error_response("INVALID_ID", "Invalid dashboard ID.", http_status=400, request=request)

        serializer = DashboardWidgetSerializer(data=request.data)
        if serializer.is_valid():
            created_by_id = getattr(request.user, "id", uuid.uuid4())
            widget = _service.add_widget(bu_id, dashboard_id, serializer.validated_data, created_by_id)
            if not widget:
                return error_response("NOT_FOUND", "Dashboard not found.", http_status=404, request=request)
            return success_response(data=DashboardWidgetSerializer(widget).data, status_code=status.HTTP_201_CREATED, request=request)
        return error_response("VALIDATION_ERROR", "Invalid data", details=serializer.errors, http_status=400, request=request)

class WidgetDataView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request: Request, widget_pk: str) -> Response:
        bu_id = _get_bu_id(request)
        if not bu_id:
            return error_response("MISSING_BUSINESS_UNIT", "X-Business-Unit-ID header required.", http_status=400, request=request)
        
        try:
            widget_id = uuid.UUID(widget_pk)
        except ValueError:
            return error_response("INVALID_ID", "Invalid widget ID.", http_status=400, request=request)

        from .models import DashboardWidget
        widget = DashboardWidget.objects.filter(business_unit_id=bu_id, id=widget_id).first()
        if not widget:
            return error_response("NOT_FOUND", "Widget not found.", http_status=404, request=request)
            
        data = _service.fetch_widget_data(bu_id, widget)
        return success_response(data=data, request=request)
