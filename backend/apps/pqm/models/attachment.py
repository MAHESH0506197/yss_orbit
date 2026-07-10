# yss_orbit\backend\apps\pqm\models\attachment.py
"""
PQMAttachment — file attachments for NC records.

Supports multi-stage attachments: before/after evidence, documents, drawings, reports.
GPS data is stored for geofence validation (flag only, never blocks submission).
File keys are S3 object paths; signed URLs are generated on-demand and never persisted.
"""
from __future__ import annotations

from django.db import models

from apps.platform.models.base import TenantModel
from apps.pqm.enums import AttachmentStage


class PQMAttachment(TenantModel):
    """
    File attachment linked to a NonConformance record.

    Versioned: a re-upload creates a new row with version+1 rather than mutating.
    GPS fields are optional; geofence validation runs asynchronously via signals.
    file_key is the S3 object key / storage path — signed URLs are never persisted.
    """

    organization_id = models.UUIDField(
        null=False,
        help_text="Denormalized from BU for tenant isolation.",
    )
    nc = models.ForeignKey(
        "pqm.NonConformance",
        on_delete=models.PROTECT,
        related_name="attachments",
    )
    uploaded_by_id = models.UUIDField(
        help_text="UUID of the user who uploaded this file.",
    )

    # ── File Metadata ─────────────────────────────────────────────────────────
    file_name = models.CharField(max_length=255)
    file_key = models.CharField(
        max_length=1000,
        help_text="S3 object key or storage path. Write-only — never exposed in API responses.",
    )
    file_url = models.TextField(
        blank=True,
        default="",
        help_text="Temporary signed URL. NOT stored permanently — generated on demand.",
    )
    file_size_bytes = models.PositiveBigIntegerField(default=0)
    mime_type = models.CharField(max_length=100)

    # ── Classification ────────────────────────────────────────────────────────
    attachment_stage = models.CharField(
        max_length=20,
        choices=AttachmentStage.choices,
        help_text="Stage this attachment belongs to (before, after, document, drawing, report).",
    )
    version = models.PositiveSmallIntegerField(
        default=1,
        help_text="Version counter. Incremented on re-upload of same logical attachment.",
    )

    # ── GPS / Geofence ────────────────────────────────────────────────────────
    photo_gps_lat = models.DecimalField(
        max_digits=10,
        decimal_places=7,
        null=True,
        blank=True,
        help_text="GPS latitude from photo EXIF data.",
    )
    photo_gps_lng = models.DecimalField(
        max_digits=10,
        decimal_places=7,
        null=True,
        blank=True,
        help_text="GPS longitude from photo EXIF data.",
    )
    photo_captured_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text="Timestamp from photo EXIF data.",
    )
    photo_exif_hash = models.CharField(
        max_length=64,
        blank=True,
        default="",
        help_text="SHA-256 hash of file bytes for deduplication.",
    )
    gps_within_geofence = models.BooleanField(
        null=True,
        blank=True,
        help_text="True/False/None. Set by geofence_service. Never blocks submission.",
    )

    # ── Description ──────────────────────────────────────────────────────────
    description = models.CharField(max_length=500, blank=True, default="")

    class Meta(TenantModel.Meta):
        db_table = "pqm_attachment"
        indexes = [
            models.Index(fields=["nc_id", "attachment_stage"]),
            models.Index(fields=["nc_id", "version"]),
        ]

    def __str__(self) -> str:
        return f"{self.file_name} [{self.attachment_stage}] v{self.version}"
