# yss_orbit\backend\apps\error_log\views.py
import logging
from rest_framework.views import APIView
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework import status

from apps.compliance.models import ErrorLog
from apps.compliance.api.serializers.error_log_serializers import ErrorLogSerializer
from apps.platform.core_pagination import CursorResultsPagination
from apps.platform.core_permissions import IsAuthenticated, IsSuperAdmin
from apps.platform.core_response import success_response

logger = logging.getLogger(__name__)

class ErrorLogListView(APIView):
    """
    GET /api/v1/error-logs/
    List error logs for a business unit or globally for super admins.
    Supports cursor-based pagination.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request: Request) -> Response:
        ctx = request.security_context  # type: ignore[attr-defined]
        bu_id = getattr(request, "business_unit_id", None)

        if ctx.is_super_admin:
            qs = ErrorLog.objects.all()
            if bu_id:
                qs = qs.filter(business_unit_id=bu_id)
        else:
            if bu_id is None:
                return success_response(data={"results": [], "count": 0}, request=request)
            # Add proper permission check if your system uses string permissions
            ctx.require_permission("error_logs.view")
            qs = ErrorLog.objects.filter(business_unit_id=bu_id)

        # Filtering
        severity = request.query_params.get("severity")
        resolved = request.query_params.get("resolved")
        correlation_id = request.query_params.get("correlation_id")

        if severity:
            qs = qs.filter(severity=severity)
        if resolved is not None:
            qs = qs.filter(resolved=resolved.lower() in ["true", "1", "yes"])
        if correlation_id:
            qs = qs.filter(correlation_id=correlation_id)

        qs = qs.order_by("-created_at")

        paginator = CursorResultsPagination()
        page = paginator.paginate_queryset(qs, request)
        if page is not None:
            serializer = ErrorLogSerializer(page, many=True)
            return paginator.get_paginated_response(serializer.data)

        serializer = ErrorLogSerializer(qs[:100], many=True)
        return success_response(data=serializer.data, request=request)


class ErrorLogDetailView(APIView):
    """
    GET /api/v1/error-logs/<id>/
    PATCH /api/v1/error-logs/<id>/ (to mark as resolved or update notes)
    """
    permission_classes = [IsAuthenticated]
    
    def get_object(self, request: Request, pk: str) -> ErrorLog:
        ctx = request.security_context
        bu_id = getattr(request, "business_unit_id", None)
        
        try:
            log = ErrorLog.objects.get(pk=pk)
        except ErrorLog.DoesNotExist:
            from rest_framework.exceptions import NotFound
            raise NotFound()
            
        if not ctx.is_super_admin:
            if log.business_unit_id != bu_id:
                from rest_framework.exceptions import PermissionDenied
                raise PermissionDenied()
            ctx.require_permission("error_logs.view")
            
        return log

    def get(self, request: Request, pk: str) -> Response:
        log = self.get_object(request, pk)
        serializer = ErrorLogSerializer(log)
        return success_response(data=serializer.data, request=request)
        
    def patch(self, request: Request, pk: str) -> Response:
        log = self.get_object(request, pk)
        
        ctx = request.security_context
        if not ctx.is_super_admin:
            ctx.require_permission("error_logs.manage")
            
        serializer = ErrorLogSerializer(log, data=request.data, partial=True)
        if serializer.is_valid():
            # If resolved changed to true, auto set resolved_at and resolved_by_id
            if "resolved" in serializer.validated_data and serializer.validated_data["resolved"] and not log.resolved:
                from django.utils import timezone
                serializer.save(
                    resolved_at=timezone.now(),
                    resolved_by_id=ctx.user_id
                )
            else:
                serializer.save()
            return success_response(data=serializer.data, request=request)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
