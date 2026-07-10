# yss_orbit\backend\apps\pqm\api\views\history_views.py
from __future__ import annotations

import uuid

from rest_framework.permissions import IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.platform.core_response import success_response, error_response
from apps.pqm.models import NonConformance
from apps.pqm.permissions import PQMPermission
from apps.pqm.api.serializers.approval_serializer import ApprovalStepSerializer
from apps.pqm.api.serializers.comment_serializer import CommentSerializer
from apps.pqm.api.views.utils import _require_bu


class NCHistoryView(APIView):
    """Merged timeline: status_history + approval_steps + comments, sorted by created_at."""
    permission_classes = [IsAuthenticated]

    def get(self, request: Request, pk: uuid.UUID) -> Response:
        bu_id, err = _require_bu(request)
        if err:
            return err
        if not PQMPermission.check_permission(request, PQMPermission.VIEW_AUDIT):
            return error_response("PQM_FORBIDDEN", "No permission to view audit history.", http_status=403, request=request)

        try:
            nc = NonConformance.objects.get(id=pk, business_unit_id=bu_id, is_deleted=False)
        except NonConformance.DoesNotExist:
            return error_response("NC_NOT_FOUND", "NC not found.", http_status=404, request=request)

        timeline = []

        # Status history entries
        for sh in nc.status_history.filter(is_deleted=False).order_by("created_at"):
            timeline.append({
                "type": "status_change",
                "event_type": sh.event_type,
                "from_status": sh.from_status,
                "to_status": sh.to_status,
                "actor_id": str(sh.actor_id),
                "reason": sh.reason,
                "metadata": sh.metadata,
                "created_at": sh.created_at.isoformat(),
            })

        # Approval steps
        for step in nc.approval_steps.filter(is_deleted=False).order_by("created_at"):
            if step.decided_at:
                timeline.append({
                    "type": "approval",
                    "stage": step.stage,
                    "sequence_order": step.sequence_order,
                    "approver_id": str(step.approver_id),
                    "decision": step.decision,
                    "comments": step.comments,
                    "created_at": step.decided_at.isoformat(),
                })

        # Comments (if permitted)
        if PQMPermission.check_permission(request, PQMPermission.VIEW_COMMENTS):
            for comment in nc.comments.filter(is_deleted=False).order_by("created_at"):
                timeline.append({
                    "type": "comment",
                    "author_id": str(comment.author_id),
                    "body": comment.body,
                    "is_internal": comment.is_internal,
                    "created_at": comment.created_at.isoformat(),
                })

        # Sort merged timeline
        timeline.sort(key=lambda x: x["created_at"])

        return success_response(data=timeline, request=request)
