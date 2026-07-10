# yss_orbit\backend\apps\files\views.py
"""
YSS Orbit — File Upload Views
Handles file upload initiation (presigned URL generation) and metadata retrieval.
Actual file upload goes directly from browser → S3 (no Django proxy).
Pattern:
  1. POST /api/v1/files/presign/ → get presigned S3 PUT URL
  2. Browser PUTs file directly to S3
  3. Browser calls POST /api/v1/files/confirm/{upload_id}/ to mark complete
  4. Background task scans file for viruses
"""
from __future__ import annotations

import hashlib
import logging
import uuid

from django.conf import settings
from rest_framework import serializers
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.platform.core_permissions import IsAuthenticated, IsTenantMember
from apps.platform.core_response import error_response, success_response
from apps.platform.models import FileUpload

logger = logging.getLogger(__name__)

# Max 50 MB per upload
MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024


class FileUploadSerializer(serializers.ModelSerializer):
    class Meta:
        model = FileUpload
        fields = [
            "id", "original_filename", "content_type", "file_size_bytes",
            "category", "scan_status", "is_public",
            "linked_resource_type", "linked_resource_id",
            "uploaded_by_id", "created_at",
        ]
        read_only_fields = fields


class PresignRequestSerializer(serializers.Serializer):
    filename = serializers.CharField(max_length=500)
    content_type = serializers.CharField(max_length=100)
    file_size_bytes = serializers.IntegerField(min_value=1)
    category = serializers.ChoiceField(
        choices=FileUpload.FileCategory.choices,
        default=FileUpload.FileCategory.OTHER,
    )
    linked_resource_type = serializers.CharField(max_length=100, required=False, default="")
    linked_resource_id = serializers.UUIDField(required=False, allow_null=True)


class FilePresignView(APIView):
    """
    POST /api/v1/files/presign/
    Returns a presigned S3 PUT URL for direct browser upload.
    Also creates a FileUpload record (scan_status=PENDING).
    """
    permission_classes = [IsAuthenticated, IsTenantMember]

    def post(self, request: Request) -> Response:
        ctx = request.security_context  # type: ignore[attr-defined]
        bu_id: uuid.UUID = ctx.require_business_unit()

        serializer = PresignRequestSerializer(data=request.data)
        if not serializer.is_valid():
            return error_response(
                error_code="FILE_001",
                message="Invalid upload request.",
                details=serializer.errors,
                http_status=400,
                request=request,
            )

        data = serializer.validated_data
        if data["file_size_bytes"] > MAX_FILE_SIZE_BYTES:
            return error_response(
                error_code="FILE_002",
                message=f"File size exceeds maximum allowed ({MAX_FILE_SIZE_BYTES // 1024 // 1024} MB).",
                http_status=400,
                request=request,
            )

        # Generate a unique storage key
        upload_id = uuid.uuid4()
        stored_key = f"uploads/{bu_id}/{upload_id}/{data['filename']}"

        # Create the pending FileUpload record
        file_upload = FileUpload.objects.create(
            business_unit_id=bu_id,
            original_filename=data["filename"],
            stored_key=stored_key,
            content_type=data["content_type"],
            file_size_bytes=data["file_size_bytes"],
            category=data.get("category", FileUpload.FileCategory.OTHER),
            uploaded_by_id=ctx.user_id,
            linked_resource_type=data.get("linked_resource_type", ""),
            linked_resource_id=data.get("linked_resource_id"),
            scan_status=FileUpload.ScanStatus.PENDING,
            created_by_id=ctx.user_id,
        )

        # Generate presigned URL (S3-compatible)
        presigned_url = self._generate_presigned_url(stored_key, data["content_type"])

        logger.info(
            "File presign issued",
            extra={
                "upload_id": str(file_upload.id),
                "user_id": str(ctx.user_id),
                "business_unit_id": str(bu_id),
                "correlation_id": ctx.correlation_id,
            },
        )

        return success_response(
            data={
                "upload_id": str(file_upload.id),
                "presigned_url": presigned_url,
                "stored_key": stored_key,
                "expires_in_seconds": 900,
            },
            http_status=201,
            request=request,
        )

    @staticmethod
    def _generate_presigned_url(key: str, content_type: str) -> str:
        """Generate presigned URL using configured storage backend."""
        try:
            import boto3
            from botocore.config import Config
            s3 = boto3.client(
                "s3",
                endpoint_url=getattr(settings, "AWS_S3_ENDPOINT_URL", None),
                aws_access_key_id=getattr(settings, "AWS_ACCESS_KEY_ID", ""),
                aws_secret_access_key=getattr(settings, "AWS_SECRET_ACCESS_KEY", ""),
                region_name=getattr(settings, "AWS_S3_REGION_NAME", "ap-south-1"),
                config=Config(signature_version="s3v4"),
            )
            bucket = getattr(settings, "AWS_STORAGE_BUCKET_NAME", "yss-orbit-uploads")
            return s3.generate_presigned_url(
                "put_object",
                Params={"Bucket": bucket, "Key": key, "ContentType": content_type},
                ExpiresIn=900,
            )
        except Exception as exc:
            logger.error("Failed to generate presigned URL: %s", exc)
            # Return placeholder in development
            return f"/dev/upload/{key}"


class FileDetailView(APIView):
    """
    GET /api/v1/files/{file_id}/
    Returns metadata for a specific file upload.
    User must own the file or be super-admin.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request: Request, file_id: str) -> Response:
        ctx = request.security_context  # type: ignore[attr-defined]

        try:
            fid = uuid.UUID(file_id)
        except ValueError:
            return error_response(
                error_code="FILE_003",
                message="Invalid file ID format.",
                http_status=400,
                request=request,
            )

        try:
            file_upload = FileUpload.objects.get(id=fid)
        except FileUpload.DoesNotExist:
            return error_response(
                error_code="FILE_004",
                message="File not found.",
                http_status=404,
                request=request,
            )

        if not ctx.is_super_admin and str(file_upload.uploaded_by_id) != str(ctx.user_id):
            return error_response(
                error_code="FILE_005",
                message="File not found.",
                http_status=404,
                request=request,
            )

        serializer = FileUploadSerializer(file_upload)
        return success_response(data=serializer.data, request=request)


class FileConfirmView(APIView):
    """
    POST /api/v1/files/confirm/{file_id}/
    Marks a file upload as completed. Should be called by the browser after S3 upload succeeds.
    Triggers virus scan background task.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request: Request, file_id: str) -> Response:
        ctx = request.security_context

        try:
            fid = uuid.UUID(file_id)
            file_upload = FileUpload.objects.get(id=fid, uploaded_by_id=ctx.user_id)
        except (ValueError, FileUpload.DoesNotExist):
            return error_response(
                error_code="FILE_004",
                message="File not found.",
                http_status=404,
                request=request,
            )
        
        # In a real app we might also check if file exists on S3
        file_upload.scan_status = FileUpload.ScanStatus.PENDING # Keep pending until scanned
        file_upload.save(update_fields=["scan_status"])
        
        # Trigger virus scan task (placeholder for celery task call)
        # from apps.platform.core_tasks import scan_file
        # scan_file.delay(str(file_upload.id))

        return success_response(
            data={"status": "confirmed"},
            request=request,
        )

class FileDownloadView(APIView):
    """
    GET /api/v1/files/download/{file_id}/
    Returns a presigned URL to download a file directly from S3.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request: Request, file_id: str) -> Response:
        ctx = request.security_context

        try:
            fid = uuid.UUID(file_id)
            file_upload = FileUpload.objects.get(id=fid)
        except (ValueError, FileUpload.DoesNotExist):
            return error_response(
                error_code="FILE_004",
                message="File not found.",
                http_status=404,
                request=request,
            )

        # Check permissions
        if not file_upload.is_public and str(file_upload.uploaded_by_id) != str(ctx.user_id) and not ctx.is_super_admin:
             return error_response(
                error_code="FILE_005",
                message="Access denied.",
                http_status=403,
                request=request,
            )
             
        try:
            import boto3
            from botocore.config import Config
            s3 = boto3.client(
                "s3",
                endpoint_url=getattr(settings, "AWS_S3_ENDPOINT_URL", None),
                aws_access_key_id=getattr(settings, "AWS_ACCESS_KEY_ID", ""),
                aws_secret_access_key=getattr(settings, "AWS_SECRET_ACCESS_KEY", ""),
                region_name=getattr(settings, "AWS_S3_REGION_NAME", "ap-south-1"),
                config=Config(signature_version="s3v4"),
            )
            bucket = getattr(settings, "AWS_STORAGE_BUCKET_NAME", "yss-orbit-uploads")
            presigned_url = s3.generate_presigned_url(
                "get_object",
                Params={"Bucket": bucket, "Key": file_upload.stored_key},
                ExpiresIn=3600,
            )
        except Exception as exc:
            logger.error("Failed to generate presigned download URL: %s", exc)
            presigned_url = f"/dev/download/{file_upload.stored_key}"
            
        return success_response(
            data={"download_url": presigned_url},
            request=request
        )
