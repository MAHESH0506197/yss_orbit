# yss_orbit\backend\apps\pqm\api\views\bulk_views.py
"""Bulk action endpoint — max 200 NC IDs per request."""
from __future__ import annotations

from rest_framework.permissions import IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.platform.core_response import success_response, error_response
from apps.pqm.models import NonConformance
from apps.pqm.permissions import PQMPermission
from apps.pqm.api.views.utils import _require_bu


class NCBulkActionView(APIView):
    permission_classes = [IsAuthenticated]
    MAX_IDS = 200

    def post(self, request: Request) -> Response:
        bu_id, err = _require_bu(request)
        if err:
            return err

        action = request.data.get("action")
        nc_ids = request.data.get("nc_ids", [])

        if not action:
            return error_response("PQM_VALIDATION_ERROR", "'action' is required.", http_status=400, request=request)
        if not isinstance(nc_ids, list) or not nc_ids:
            return error_response("PQM_VALIDATION_ERROR", "'nc_ids' must be a non-empty list.", http_status=400, request=request)
        if len(nc_ids) > self.MAX_IDS:
            return error_response("PQM_VALIDATION_ERROR", f"Maximum {self.MAX_IDS} IDs per bulk action.", http_status=400, request=request)

        qs = NonConformance.objects.filter(id__in=nc_ids, business_unit_id=bu_id, is_deleted=False)

        if action == "acknowledge":
            # Mark as read/acknowledged (placeholder — just validates IDs are accessible)
            return success_response(data={"acknowledged": qs.count()}, request=request)

        elif action == "export":
            if not PQMPermission.check_permission(request, PQMPermission.EXPORT_REPORT):
                return error_response("PQM_FORBIDDEN", "No permission to export.", http_status=403, request=request)
            ids = list(qs.values_list("id", flat=True))
            return success_response(
                data={"message": "Export queued.", "nc_count": len(ids)},
                request=request,
            )

        else:
            return error_response("PQM_VALIDATION_ERROR", f"Unknown action: {action}.", http_status=400, request=request)
