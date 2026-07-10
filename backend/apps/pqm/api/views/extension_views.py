# yss_orbit\backend\apps\pqm\api\views\extension_views.py
from __future__ import annotations

import uuid

from django.core.exceptions import ValidationError
from django.utils import timezone

from rest_framework.permissions import IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.platform.core_response import success_response, created_response, error_response
from apps.pqm.models import NonConformance
from apps.pqm.models.extension_request import PQMExtensionRequest
from apps.pqm.permissions import PQMPermission
from apps.pqm.enums import ApprovalDecision
from apps.pqm.api.serializers.extension_serializer import ExtensionRequestSerializer, ExtensionDecisionSerializer
from apps.pqm.api.views.utils import _require_bu
from apps.pqm.services.notification_service import NotificationService


class NCExtensionRequestView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request: Request, pk: uuid.UUID) -> Response:
        bu_id, err = _require_bu(request)
        if err:
            return err

        try:
            nc = NonConformance.objects.get(id=pk, business_unit_id=bu_id, is_deleted=False)
        except NonConformance.DoesNotExist:
            return error_response("NC_NOT_FOUND", "NC not found.", http_status=404, request=request)

        serializer = ExtensionRequestSerializer(data=request.data)
        if not serializer.is_valid():
            return error_response("PQM_VALIDATION_ERROR", "Invalid data.", details=serializer.errors, http_status=400, request=request)

        ext = PQMExtensionRequest.objects.create(
            organization_id=nc.organization_id,
            business_unit_id=nc.business_unit_id,
            nc=nc,
            requested_by_id=request.user.id,
            original_target_date=nc.target_closure_date,
            requested_date=serializer.validated_data["requested_date"],
            reason=serializer.validated_data["reason"],
            decision=ApprovalDecision.PENDING,
        )
        NotificationService.send_nc_event(nc, "nc_extension_requested")
        return created_response(
            data={"id": str(ext.id), "nc": str(nc.id), "requested_date": str(ext.requested_date), "decision": ext.decision},
            request=request,
        )


class NCExtensionDecisionView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request: Request, pk: uuid.UUID) -> Response:
        bu_id, err = _require_bu(request)
        if err:
            return err

        try:
            nc = NonConformance.objects.get(id=pk, business_unit_id=bu_id, is_deleted=False)
        except NonConformance.DoesNotExist:
            return error_response("NC_NOT_FOUND", "NC not found.", http_status=404, request=request)

        # Get pending extension request
        try:
            ext = PQMExtensionRequest.objects.filter(nc=nc, decision=ApprovalDecision.PENDING).latest("created_at")
        except PQMExtensionRequest.DoesNotExist:
            return error_response("NO_PENDING_EXTENSION", "No pending extension request.", http_status=404, request=request)

        serializer = ExtensionDecisionSerializer(data=request.data)
        if not serializer.is_valid():
            return error_response("PQM_VALIDATION_ERROR", "Invalid data.", details=serializer.errors, http_status=400, request=request)

        ext.decision = serializer.validated_data["decision"]
        ext.decision_comments = serializer.validated_data.get("decision_comments", "")
        ext.decided_by_id = request.user.id
        ext.decided_at = timezone.now()
        ext.save()

        if ext.decision == ApprovalDecision.APPROVED:
            nc.target_closure_date = ext.requested_date
            nc.save(update_fields=["target_closure_date", "updated_at"])
            NotificationService.send_nc_event(nc, "nc_extension_decided")

        return success_response(
            data={"decision": ext.decision, "new_target_date": str(nc.target_closure_date)},
            request=request,
        )
