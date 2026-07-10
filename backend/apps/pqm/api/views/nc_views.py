# yss_orbit\backend\apps\pqm\api\views\nc_views.py
"""
NC API Views — all CRUD + lifecycle action endpoints.
All views:
  - Require IsAuthenticated
  - Use _require_bu() for tenant isolation
  - Return 404 (not 403) for out-of-scope resource IDs
  - Use success_response / error_response from platform
"""
from __future__ import annotations

import uuid

from django.core.exceptions import ObjectDoesNotExist, ValidationError
from rest_framework.permissions import IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.platform.core_response import (
    success_response, created_response, no_content_response, error_response,
)
from apps.pqm.models import NonConformance
from apps.pqm.permissions import PQMPermission, IsProjectMember
from apps.pqm.api.serializers.nc_serializers import (
    NCListSerializer, NCDetailSerializer, NCCreateSerializer, NCUpdateSerializer,
)
from apps.pqm.api.views.utils import _require_bu, _get_org_id
from apps.pqm.services.nc_service import NCService
from apps.pqm.services.approval_service import ApprovalService
from apps.pqm.services.duplicate_service import DuplicateService
from apps.pqm.enums import NCStatus


def _get_nc_or_404(pk: uuid.UUID, bu_id: uuid.UUID, request: Request) -> tuple:
    """Return (nc, None) or (None, error_response) scoped to BU."""
    try:
        nc = NonConformance.objects.get(id=pk, business_unit_id=bu_id, is_deleted=False)
        from apps.pqm.models.project_access import PQMProjectMember
        if not PQMProjectMember.objects.filter(user_id=request.user.id, project_id=nc.project_id, is_deleted=False).exists():
            return None, error_response("PQM_FORBIDDEN", "You are not a member of this project.", http_status=403, request=request)
        return nc, None
    except NonConformance.DoesNotExist:
        return None, error_response("NC_NOT_FOUND", "Non-conformance not found.", http_status=404, request=request)


# ---------------------------------------------------------------------------
# List + Create
# ---------------------------------------------------------------------------
class NCListView(APIView):
    permission_classes = [IsAuthenticated, IsProjectMember]

    def get(self, request: Request) -> Response:
        bu_id, err = _require_bu(request)
        if err:
            return err
        if not PQMPermission.check_permission(request, PQMPermission.VIEW_NC):
            return error_response("PQM_FORBIDDEN", "You do not have permission to view NCs.", http_status=403, request=request)

        qs = (
            NonConformance.objects.filter(business_unit_id=bu_id, is_deleted=False)
            .select_related("project", "category")
            .order_by("-created_at")
        )

        # Apply filters from query params
        p = request.query_params
        if p.get("status"):
            qs = qs.filter(status=p["status"])
        if p.get("priority"):
            qs = qs.filter(priority=p["priority"])
        if p.get("severity"):
            qs = qs.filter(severity=p["severity"])
            
        project_id = p.get("project")
        if not project_id:
            return error_response("PQM_VALIDATION_ERROR", "project parameter is required.", http_status=400, request=request)
        qs = qs.filter(project_id=project_id)
        
        # Site filtering removed as site is no longer part of NonConformance
        if p.get("assigned_to_id"):
            qs = qs.filter(assigned_to_id=p["assigned_to_id"])
        if p.get("is_safety_critical") in ("true", "1", "True"):
            qs = qs.filter(is_safety_critical=True)
        if p.get("search"):
            from django.db.models import Q
            term = p["search"]
            qs = qs.filter(Q(nc_number__icontains=term) | Q(title__icontains=term))

        # Pagination
        page = max(1, int(p.get("page", 1)))
        page_size = min(100, int(p.get("page_size", 25)))
        total = qs.count()
        start = (page - 1) * page_size
        items = qs[start: start + page_size]

        return success_response(
            data={
                "count": total,
                "next": None,
                "previous": None,
                "results": NCListSerializer(items, many=True).data,
            },
            request=request,
        )

    def post(self, request: Request) -> Response:
        bu_id, err = _require_bu(request)
        if err:
            return err
        if not PQMPermission.check_permission(request, PQMPermission.CREATE_NC):
            return error_response("PQM_FORBIDDEN", "You do not have permission to create NCs.", http_status=403, request=request)

        serializer = NCCreateSerializer(data=request.data, context={"request": request})
        if not serializer.is_valid():
            return error_response("PQM_VALIDATION_ERROR", "Invalid data.", details=serializer.errors, http_status=400, request=request)

        org_id = _get_org_id(request)
        try:
            nc = NCService.create_nc(bu_id, org_id, serializer.validated_data, request.user.id)
        except ValidationError as exc:
            return error_response("PQM_VALIDATION_ERROR", str(exc.message), http_status=400, request=request)

        return created_response(data=NCDetailSerializer(nc, context={"request": request}).data, request=request)


# ---------------------------------------------------------------------------
# Retrieve + Update
# ---------------------------------------------------------------------------
class NCDetailView(APIView):
    permission_classes = [IsAuthenticated, IsProjectMember]

    def get(self, request: Request, pk: uuid.UUID) -> Response:
        bu_id, err = _require_bu(request)
        if err:
            return err
        nc, err = _get_nc_or_404(pk, bu_id, request)
        if err:
            return err
        if not PQMPermission.check_permission(request, PQMPermission.VIEW_NC):
            return error_response("PQM_FORBIDDEN", "No permission.", http_status=403, request=request)
        return success_response(data=NCDetailSerializer(nc, context={"request": request}).data, request=request)

    def patch(self, request: Request, pk: uuid.UUID) -> Response:
        bu_id, err = _require_bu(request)
        if err:
            return err
        nc, err = _get_nc_or_404(pk, bu_id, request)
        if err:
            return err
        if not PQMPermission.check_permission(request, PQMPermission.EDIT_NC):
            return error_response("PQM_FORBIDDEN", "No permission to edit NC.", http_status=403, request=request)

        serializer = NCUpdateSerializer(nc, data=request.data, partial=True, context={"request": request})
        if not serializer.is_valid():
            return error_response("PQM_VALIDATION_ERROR", "Invalid data.", details=serializer.errors, http_status=400, request=request)
        serializer.save(updated_by_id=request.user.id)
        return success_response(data=NCDetailSerializer(nc, context={"request": request}).data, request=request)


# ---------------------------------------------------------------------------
# Submit
# ---------------------------------------------------------------------------
class NCSubmitView(APIView):
    permission_classes = [IsAuthenticated, IsProjectMember]

    def post(self, request: Request, pk: uuid.UUID) -> Response:
        bu_id, err = _require_bu(request)
        if err:
            return err
        nc, err = _get_nc_or_404(pk, bu_id, request)
        if err:
            return err
        if not PQMPermission.check_permission(request, PQMPermission.SUBMIT_NC):
            return error_response("PQM_FORBIDDEN", "No permission to submit NC.", http_status=403, request=request)

        try:
            nc = NCService.submit_nc(nc, request.user.id)
        except ValidationError as exc:
            return error_response("PQM_SUBMIT_ERROR", str(exc.message), http_status=400, request=request)

        resp_data = NCDetailSerializer(nc, context={"request": request}).data
        if getattr(nc, "_duplicate_warning", False):
            resp_data["_warnings"] = ["Similar NCs found. Please check for duplicates."]
        return success_response(data=resp_data, request=request)


# ---------------------------------------------------------------------------
# Review Decision
# ---------------------------------------------------------------------------
class NCReviewDecisionView(APIView):
    permission_classes = [IsAuthenticated, IsProjectMember]

    def post(self, request: Request, pk: uuid.UUID) -> Response:
        bu_id, err = _require_bu(request)
        if err:
            return err
        nc, err = _get_nc_or_404(pk, bu_id, request)
        if err:
            return err
        if not PQMPermission.check_permission(request, PQMPermission.REVIEW_NC):
            return error_response("PQM_FORBIDDEN", "No permission to review NC.", http_status=403, request=request)

        from apps.pqm.api.serializers.approval_serializer import ApprovalDecisionSerializer
        ser = ApprovalDecisionSerializer(data=request.data)
        if not ser.is_valid():
            return error_response("PQM_VALIDATION_ERROR", "Invalid data.", details=ser.errors, http_status=400, request=request)

        try:
            nc = ApprovalService.make_review_decision(
                nc, ser.validated_data["decision"], request.user.id, ser.validated_data.get("comments", "")
            )
        except ValidationError as exc:
            return error_response("PQM_REVIEW_ERROR", str(exc.message), http_status=400, request=request)

        return success_response(data=NCDetailSerializer(nc, context={"request": request}).data, request=request)


# ---------------------------------------------------------------------------
# Assign
# ---------------------------------------------------------------------------
class NCAssignView(APIView):
    permission_classes = [IsAuthenticated, IsProjectMember]

    def post(self, request: Request, pk: uuid.UUID) -> Response:
        bu_id, err = _require_bu(request)
        if err:
            return err
        nc, err = _get_nc_or_404(pk, bu_id, request)
        if err:
            return err
        if not PQMPermission.check_permission(request, PQMPermission.ASSIGN_NC):
            return error_response("PQM_FORBIDDEN", "No permission to assign NC.", http_status=403, request=request)

        assignee_id = request.data.get("assigned_to_id")
        if not assignee_id:
            return error_response("PQM_VALIDATION_ERROR", "assigned_to_id is required.", http_status=400, request=request)

        try:
            assignee_uuid = uuid.UUID(str(assignee_id))
            nc = NCService.assign_nc(nc, assignee_uuid, request.user.id)
        except (ValueError, ValidationError) as exc:
            return error_response("PQM_ASSIGN_ERROR", str(exc), http_status=400, request=request)

        return success_response(data=NCDetailSerializer(nc, context={"request": request}).data, request=request)


# ---------------------------------------------------------------------------
# Start Work
# ---------------------------------------------------------------------------
class NCStartWorkView(APIView):
    permission_classes = [IsAuthenticated, IsProjectMember]

    def post(self, request: Request, pk: uuid.UUID) -> Response:
        bu_id, err = _require_bu(request)
        if err:
            return err
        nc, err = _get_nc_or_404(pk, bu_id, request)
        if err:
            return err
        if not PQMPermission.check_permission(request, PQMPermission.UPDATE_NC_PROGRESS):
            return error_response("PQM_FORBIDDEN", "No permission.", http_status=403, request=request)

        try:
            nc = NCService.transition_status(nc, NCStatus.IN_PROGRESS, request.user.id)
        except ValidationError as exc:
            return error_response("PQM_TRANSITION_ERROR", str(exc.message), http_status=400, request=request)

        return success_response(data=NCDetailSerializer(nc, context={"request": request}).data, request=request)


# ---------------------------------------------------------------------------
# Request Closure
# ---------------------------------------------------------------------------
class NCRequestClosureView(APIView):
    permission_classes = [IsAuthenticated, IsProjectMember]

    def post(self, request: Request, pk: uuid.UUID) -> Response:
        bu_id, err = _require_bu(request)
        if err:
            return err
        nc, err = _get_nc_or_404(pk, bu_id, request)
        if err:
            return err
        if not PQMPermission.check_permission(request, PQMPermission.REQUEST_CLOSURE):
            return error_response("PQM_FORBIDDEN", "No permission.", http_status=403, request=request)

        try:
            nc = ApprovalService.request_closure(nc, request.user.id)
        except ValidationError as exc:
            return error_response("PQM_CLOSURE_ERROR", str(exc.message), http_status=400, request=request)

        return success_response(data=NCDetailSerializer(nc, context={"request": request}).data, request=request)


# ---------------------------------------------------------------------------
# Verification Decision
# ---------------------------------------------------------------------------
class NCVerificationDecisionView(APIView):
    permission_classes = [IsAuthenticated, IsProjectMember]

    def post(self, request: Request, pk: uuid.UUID) -> Response:
        bu_id, err = _require_bu(request)
        if err:
            return err
        nc, err = _get_nc_or_404(pk, bu_id, request)
        if err:
            return err
        if not PQMPermission.check_permission(request, PQMPermission.VERIFY_NC):
            return error_response("PQM_FORBIDDEN", "No permission to verify NC.", http_status=403, request=request)

        from apps.pqm.api.serializers.approval_serializer import ApprovalDecisionSerializer
        ser = ApprovalDecisionSerializer(data=request.data)
        if not ser.is_valid():
            return error_response("PQM_VALIDATION_ERROR", "Invalid data.", details=ser.errors, http_status=400, request=request)

        level = int(request.data.get("level", nc.current_approval_level + 1))
        try:
            nc = ApprovalService.make_verification_decision(
                nc, level, ser.validated_data["decision"],
                request.user.id, ser.validated_data.get("comments", ""),
            )
        except ValidationError as exc:
            return error_response("PQM_VERIFY_ERROR", str(exc.message), http_status=400, request=request)

        return success_response(data=NCDetailSerializer(nc, context={"request": request}).data, request=request)


# ---------------------------------------------------------------------------
# Reopen
# ---------------------------------------------------------------------------
class NCReopenView(APIView):
    permission_classes = [IsAuthenticated, IsProjectMember]

    def post(self, request: Request, pk: uuid.UUID) -> Response:
        bu_id, err = _require_bu(request)
        if err:
            return err
        nc, err = _get_nc_or_404(pk, bu_id, request)
        if err:
            return err
        if not PQMPermission.check_permission(request, PQMPermission.REOPEN_NC):
            return error_response("PQM_FORBIDDEN", "No permission to reopen NC.", http_status=403, request=request)

        reason = request.data.get("reason", "").strip()
        try:
            nc = ApprovalService.reopen_nc(nc, request.user.id, reason)
        except ValidationError as exc:
            return error_response("PQM_REOPEN_ERROR", str(exc.message), http_status=400, request=request)

        return success_response(data=NCDetailSerializer(nc, context={"request": request}).data, request=request)


# ---------------------------------------------------------------------------
# Reassign
# ---------------------------------------------------------------------------
class NCReassignView(APIView):
    permission_classes = [IsAuthenticated, IsProjectMember]

    def post(self, request: Request, pk: uuid.UUID) -> Response:
        bu_id, err = _require_bu(request)
        if err:
            return err
        nc, err = _get_nc_or_404(pk, bu_id, request)
        if err:
            return err
        if not PQMPermission.check_permission(request, PQMPermission.ASSIGN_NC):
            return error_response("PQM_FORBIDDEN", "No permission.", http_status=403, request=request)

        new_id = request.data.get("new_assignee_id")
        reason = request.data.get("reason", "").strip()
        if not new_id:
            return error_response("PQM_VALIDATION_ERROR", "new_assignee_id is required.", http_status=400, request=request)

        try:
            nc = NCService.assign_nc(nc, uuid.UUID(str(new_id)), request.user.id)
        except (ValueError, ValidationError) as exc:
            return error_response("PQM_REASSIGN_ERROR", str(exc), http_status=400, request=request)

        return success_response(data=NCDetailSerializer(nc, context={"request": request}).data, request=request)


# ---------------------------------------------------------------------------
# Merge
# ---------------------------------------------------------------------------
class NCMergeView(APIView):
    permission_classes = [IsAuthenticated, IsProjectMember]

    def post(self, request: Request, pk: uuid.UUID) -> Response:
        bu_id, err = _require_bu(request)
        if err:
            return err
        source_nc, err = _get_nc_or_404(pk, bu_id, request)
        if err:
            return err
        if not PQMPermission.check_permission(request, PQMPermission.MERGE_NC):
            return error_response("PQM_FORBIDDEN", "No permission to merge NCs.", http_status=403, request=request)

        target_id = request.data.get("target_nc_id")
        if not target_id:
            return error_response("PQM_VALIDATION_ERROR", "target_nc_id is required.", http_status=400, request=request)

        target_nc, err = _get_nc_or_404(uuid.UUID(str(target_id)), bu_id, request)
        if err:
            return err

        if str(source_nc.id) == str(target_nc.id):
            return error_response("PQM_MERGE_ERROR", "Cannot merge an NC with itself.", http_status=400, request=request)

        try:
            DuplicateService.merge_nc(source_nc, target_nc, request.user.id)
        except ValidationError as exc:
            return error_response("PQM_MERGE_ERROR", str(exc.message), http_status=400, request=request)

        return success_response(
            data=NCDetailSerializer(target_nc, context={"request": request}).data,
            request=request,
        )


# ---------------------------------------------------------------------------
# Duplicate Check
# ---------------------------------------------------------------------------
class NCDuplicateCheckView(APIView):
    permission_classes = [IsAuthenticated, IsProjectMember]

    def get(self, request: Request, pk: uuid.UUID) -> Response:
        bu_id, err = _require_bu(request)
        if err:
            return err
        nc, err = _get_nc_or_404(pk, bu_id, request)
        if err:
            return err

        similar = DuplicateService.find_similar_ncs(nc)
        return success_response(
            data=NCListSerializer(similar[:10], many=True).data,
            request=request,
        )
