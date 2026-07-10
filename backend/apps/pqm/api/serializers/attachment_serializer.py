# yss_orbit\backend\apps\pqm\api\serializers\attachment_serializer.py
from rest_framework import serializers
from apps.pqm.models import PQMAttachment


class AttachmentSerializer(serializers.ModelSerializer):
    # file_key is write-only — never returned to client
    file_key = serializers.CharField(write_only=True, required=False)
    # Signed URL computed field — would be populated by S3 presigner in production
    signed_url = serializers.SerializerMethodField()

    class Meta:
        model = PQMAttachment
        fields = [
            "id", "nc", "uploaded_by_id", "file_name", "file_key", "signed_url",
            "file_size_bytes", "mime_type", "attachment_stage", "version",
            "photo_gps_lat", "photo_gps_lng", "photo_captured_at",
            "gps_within_geofence", "description", "created_at",
        ]
        read_only_fields = [
            "id", "uploaded_by_id", "signed_url", "gps_within_geofence",
            "version", "created_at",
        ]

    def get_signed_url(self, obj):
        """
        In production: call boto3 generate_presigned_url for obj.file_key.
        Returns None if not available (local dev / missing config).
        """
        try:
            import boto3
            from django.conf import settings
            s3 = boto3.client("s3")
            return s3.generate_presigned_url(
                "get_object",
                Params={"Bucket": settings.AWS_STORAGE_BUCKET_NAME, "Key": obj.file_key},
                ExpiresIn=3600,
            )
        except Exception:
            return None
