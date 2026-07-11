# yss_orbit\backend\apps\pqm\api\views\attachment_views.py
from __future__ import annotations

import os
import uuid

from rest_framework.permissions import IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.platform.core_response import success_response, created_response, no_content_response, error_response
from apps.pqm.models import NonConformance, PQMAttachment
from apps.pqm.permissions import PQMPermission
from apps.pqm.api.serializers.attachment_serializer import AttachmentSerializer
from apps.pqm.api.views.utils import _require_bu
from django.core.files.storage import default_storage


class NCAttachmentListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request: Request, pk: uuid.UUID) -> Response:
        bu_id, err = _require_bu(request)
        if err:
            return err
        try:
            nc = NonConformance.objects.get(id=pk, business_unit_id=bu_id, is_deleted=False)
        except NonConformance.DoesNotExist:
            return error_response("NC_NOT_FOUND", "NC not found.", http_status=404, request=request)

        attachments = nc.attachments.filter(is_deleted=False).order_by("attachment_stage", "version")
        return success_response(data=AttachmentSerializer(attachments, many=True).data, request=request)

    def post(self, request: Request, pk: uuid.UUID) -> Response:
        bu_id, err = _require_bu(request)
        if err:
            return err
        if not PQMPermission.check_permission(request, PQMPermission.UPLOAD_ATTACHMENT):
            return error_response("PQM_FORBIDDEN", "No permission to upload attachments.", http_status=403, request=request)

        try:
            nc = NonConformance.objects.get(id=pk, business_unit_id=bu_id, is_deleted=False)
        except NonConformance.DoesNotExist:
            return error_response("NC_NOT_FOUND", "NC not found.", http_status=404, request=request)

        data = request.data.copy()
        data["nc"] = str(nc.id)

        uploaded_file = request.FILES.get("file")
        if uploaded_file:
            stage = data.get("attachment_stage", "before")
            if stage == "before":
                current_count = nc.attachments.filter(attachment_stage="before", is_deleted=False).count()
                if current_count >= 5:
                    return error_response("PQM_VALIDATION_ERROR", "Maximum 5 before-photos allowed per NC.", http_status=400, request=request)
            
            ext = os.path.splitext(uploaded_file.name)[1]
            index = nc.attachments.filter(is_deleted=False).count() + 1
            new_filename = f"{nc.nc_number}_{index}{ext}"
            
            file_key = f"uploads/bu_{bu_id}/proj_{nc.project_id}/nc_{nc.id}/{new_filename}"
            saved_path = default_storage.save(file_key, uploaded_file)
            
            data["file_name"] = new_filename
            data["file_key"] = saved_path
            data["file_size_bytes"] = uploaded_file.size
            data["mime_type"] = uploaded_file.content_type

        serializer = AttachmentSerializer(data=data)
        if not serializer.is_valid():
            return error_response("PQM_VALIDATION_ERROR", "Invalid attachment data.", details=serializer.errors, http_status=400, request=request)

        attachment = serializer.save(
            uploaded_by_id=request.user.id,
            organization_id=nc.organization_id,
            business_unit_id=nc.business_unit_id,
        )
        return created_response(data=AttachmentSerializer(attachment).data, request=request)


class NCAttachmentDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request: Request, pk: uuid.UUID, apk: uuid.UUID) -> Response:
        bu_id, err = _require_bu(request)
        if err:
            return err
        try:
            attachment = PQMAttachment.objects.get(id=apk, nc_id=pk, nc__business_unit_id=bu_id, is_deleted=False)
        except PQMAttachment.DoesNotExist:
            return error_response("ATTACHMENT_NOT_FOUND", "Attachment not found.", http_status=404, request=request)

        return success_response(data=AttachmentSerializer(attachment).data, request=request)

    def delete(self, request: Request, pk: uuid.UUID, apk: uuid.UUID) -> Response:
        bu_id, err = _require_bu(request)
        if err:
            return err
        try:
            attachment = PQMAttachment.objects.get(id=apk, nc_id=pk, nc__business_unit_id=bu_id, is_deleted=False)
        except PQMAttachment.DoesNotExist:
            return error_response("ATTACHMENT_NOT_FOUND", "Attachment not found.", http_status=404, request=request)

        attachment.soft_delete(deleted_by_id=request.user.id)
        return no_content_response(request=request)
