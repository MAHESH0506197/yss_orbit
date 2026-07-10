# yss_orbit\backend\apps\pqm\api\views\report_views.py
"""Export view — CSV/JSON export of scoped, filtered NCs."""
from __future__ import annotations

import csv
import io

from django.http import HttpResponse
from rest_framework.permissions import IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.platform.core_response import error_response
from apps.pqm.models import NonConformance
from apps.pqm.permissions import PQMPermission
from apps.pqm.api.views.utils import _require_bu


class NCExportView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request: Request) -> Response:
        bu_id, err = _require_bu(request)
        if err:
            return err
        if not PQMPermission.check_permission(request, PQMPermission.EXPORT_REPORT):
            return error_response("PQM_FORBIDDEN", "No permission to export.", http_status=403, request=request)

        qs = (
            NonConformance.objects.filter(business_unit_id=bu_id, is_deleted=False)
            .select_related("assigned_to", "project", "category", "raised_by")
            .order_by("-created_at")
        )
        p = request.query_params
        if p.get("status"):
            qs = qs.filter(status=p["status"])
        if p.get("priority"):
            qs = qs.filter(priority=p["priority"])
        if p.get("project"):
            qs = qs.filter(project_id=p["project"])

        qs = qs[:5000]  # Cap export at 5000 rows

        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow([
            "NC Number", "Title", "Status", "Priority", "Severity",
            "Safety Critical", "Project", "Assigned To",
            "Raised Date", "Target Closure", "Actual Closure",
            "Raised By", "Category", "Root Cause",
        ])

        for nc in qs.iterator():
            writer.writerow([
                nc.nc_number, nc.title, nc.status, nc.priority, nc.severity,
                "Yes" if nc.is_safety_critical else "No",
                nc.project.name if nc.project else "",
                str(nc.assigned_to_id or ""),
                nc.raised_date, nc.target_closure_date, nc.actual_closure_date or "",
                str(nc.raised_by_id), nc.category.name if nc.category else "",
                nc.root_cause_description[:200] if nc.root_cause_description else "",
            ])

        response = HttpResponse(output.getvalue(), content_type="text/csv")
        response["Content-Disposition"] = 'attachment; filename="nc_export.csv"'
        return response
