# yss_orbit\backend\apps\pqm\api\views\config_views.py
"""Config views: Categories, Contractors, Escalation Config — require pqm.manage_config."""
from __future__ import annotations

import uuid

from rest_framework.permissions import IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.platform.core_response import (
    success_response, created_response, no_content_response, error_response,
)
from apps.pqm.models import PQMContractor
from apps.pqm.models.escalation_config import PQMEscalationConfig
from apps.pqm.permissions import PQMPermission
from apps.pqm.api.serializers.contractor_serializer import PQMContractorSerializer
from apps.pqm.api.views.utils import _require_bu, _get_org_id





# ---------------------------------------------------------------------------
# Contractors
# ---------------------------------------------------------------------------
class ContractorListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request: Request) -> Response:
        bu_id, err = _require_bu(request)
        if err:
            return err
        qs = PQMContractor.objects.filter(business_unit_id=bu_id, is_deleted=False).select_related("project").order_by("name")
        return success_response(data=PQMContractorSerializer(qs, many=True).data, request=request)

    def post(self, request: Request) -> Response:
        bu_id, err = _require_bu(request)
        if err:
            return err
        if not PQMPermission.check_permission(request, PQMPermission.MANAGE_CONFIG):
            return error_response("PQM_FORBIDDEN", "No permission.", http_status=403, request=request)
        serializer = PQMContractorSerializer(data=request.data)
        if not serializer.is_valid():
            return error_response("PQM_VALIDATION_ERROR", "Invalid data.", details=serializer.errors, http_status=400, request=request)
        from django.db import IntegrityError
        try:
            obj = serializer.save(organization_id=_get_org_id(request), business_unit_id=bu_id, created_by_id=request.user.id)
            return created_response(data=PQMContractorSerializer(obj).data, request=request)
        except IntegrityError:
            return error_response("DUPLICATE_CONTRACTOR", "A contractor with this company name already exists.", http_status=400, request=request)


class ContractorDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def _get(self, pk, bu_id):
        try:
            return PQMContractor.objects.get(id=pk, business_unit_id=bu_id, is_deleted=False), None
        except PQMContractor.DoesNotExist:
            return None, "Contractor not found."

    def get(self, request: Request, pk: uuid.UUID) -> Response:
        bu_id, err = _require_bu(request)
        if err:
            return err
        obj, err_msg = self._get(pk, bu_id)
        if err_msg:
            return error_response("NOT_FOUND", err_msg, http_status=404, request=request)
        return success_response(data=PQMContractorSerializer(obj).data, request=request)

    def patch(self, request: Request, pk: uuid.UUID) -> Response:
        bu_id, err = _require_bu(request)
        if err:
            return err
        if not PQMPermission.check_permission(request, PQMPermission.MANAGE_CONFIG):
            return error_response("PQM_FORBIDDEN", "No permission.", http_status=403, request=request)
        obj, err_msg = self._get(pk, bu_id)
        if err_msg:
            return error_response("NOT_FOUND", err_msg, http_status=404, request=request)
        serializer = PQMContractorSerializer(obj, data=request.data, partial=True)
        if not serializer.is_valid():
            return error_response("PQM_VALIDATION_ERROR", "Invalid data.", details=serializer.errors, http_status=400, request=request)
        from django.db import IntegrityError
        try:
            serializer.save(updated_by_id=request.user.id)
            return success_response(data=serializer.data, request=request)
        except IntegrityError:
            return error_response("DUPLICATE_CONTRACTOR", "A contractor with this company name already exists.", http_status=400, request=request)

    def delete(self, request: Request, pk: uuid.UUID) -> Response:
        bu_id, err = _require_bu(request)
        if err:
            return err
        if not PQMPermission.check_permission(request, PQMPermission.MANAGE_CONFIG):
            return error_response("PQM_FORBIDDEN", "No permission.", http_status=403, request=request)
        obj, err_msg = self._get(pk, bu_id)
        if err_msg:
            return error_response("NOT_FOUND", err_msg, http_status=404, request=request)
        obj.delete()
        return no_content_response(request=request)


# ---------------------------------------------------------------------------
# Escalation Config
# ---------------------------------------------------------------------------
class EscalationConfigView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request: Request) -> Response:
        bu_id, err = _require_bu(request)
        if err:
            return err
        if not PQMPermission.check_permission(request, PQMPermission.MANAGE_CONFIG):
            return error_response("PQM_FORBIDDEN", "No permission.", http_status=403, request=request)
        org_id = _get_org_id(request)
        qs = PQMEscalationConfig.objects.filter(organization_id=org_id, business_unit_id=bu_id, is_deleted=False)
        data = list(qs.values(
            "id", "priority", "sla_days",
            "escalation_day_1", "escalation_day_2", "escalation_day_3",
            "escalation_1_recipient_role", "escalation_2_recipient_role", "escalation_3_recipient_role",
        ))
        return success_response(data=data, request=request)

    def put(self, request: Request) -> Response:
        bu_id, err = _require_bu(request)
        if err:
            return err
        if not PQMPermission.check_permission(request, PQMPermission.MANAGE_CONFIG):
            return error_response("PQM_FORBIDDEN", "No permission.", http_status=403, request=request)
        org_id = _get_org_id(request)
        rows = request.data if isinstance(request.data, list) else [request.data]
        saved = []
        for row in rows:
            priority = row.get("priority")
            if not priority:
                continue
            obj, _ = PQMEscalationConfig.objects.update_or_create(
                organization_id=org_id,
                business_unit_id=bu_id,
                priority=priority,
                defaults={k: v for k, v in row.items() if k != "priority"},
            )
            saved.append(str(obj.id))
        return success_response(data={"updated": saved}, request=request)
