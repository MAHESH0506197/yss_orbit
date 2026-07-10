# yss_orbit\backend\apps\pqm\api\views\import_views.py
"""Legacy import endpoint — accepts JSON body or file upload."""
from __future__ import annotations

import csv
import io
import json

from rest_framework.permissions import IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.platform.core_response import success_response, error_response
from apps.pqm.permissions import PQMPermission
from apps.pqm.services.migration_service import MigrationService
from apps.pqm.api.views.utils import _require_bu, _get_org_id


class LegacyImportView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request: Request) -> Response:
        bu_id, err = _require_bu(request)
        if err:
            return err
        if not PQMPermission.check_permission(request, PQMPermission.RUN_LEGACY_IMPORT):
            return error_response("PQM_FORBIDDEN", "No permission to run legacy import.", http_status=403, request=request)

        org_id = _get_org_id(request)
        rows = []

        # Accept multipart CSV or JSON body
        uploaded_file = request.FILES.get("file")
        if uploaded_file:
            content = uploaded_file.read().decode("utf-8-sig")
            reader = csv.DictReader(io.StringIO(content))
            rows = list(reader)
        elif request.data.get("rows"):
            rows = request.data["rows"]
            if isinstance(rows, str):
                try:
                    rows = json.loads(rows)
                except Exception:
                    return error_response("PQM_IMPORT_ERROR", "Invalid JSON in 'rows' field.", http_status=400, request=request)
        else:
            return error_response("PQM_IMPORT_ERROR", "Provide a CSV file or 'rows' JSON body.", http_status=400, request=request)

        if len(rows) > 2000:
            return error_response("PQM_IMPORT_ERROR", "Maximum 2000 rows per import batch.", http_status=400, request=request)

        result = MigrationService.import_legacy_batch(
            rows=rows,
            organization_id=org_id,
            bu_id=bu_id,
            actor_id=request.user.id,
        )
        return success_response(data=result, request=request)
