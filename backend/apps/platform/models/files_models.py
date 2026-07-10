# yss_orbit\backend\apps\files\models.py
"""
YSS Orbit — File Storage Models
Tracks uploaded files with metadata, tenant isolation, and virus-scan status.
Actual storage is on S3/MinIO — model stores metadata only.
"""
from __future__ import annotations

import uuid

from django.db import models

from apps.platform.models.base import TenantModel


class FileUpload(TenantModel):
    """
    Metadata record for an uploaded file.
    Actual bytes are on S3/MinIO. This record tracks ownership, scan status, usage.
    """

    class StorageBackend(models.TextChoices):
        S3 = "S3", "Amazon S3"
        GCS = "GCS", "Google Cloud Storage"
        MINIO = "MINIO", "MinIO (self-hosted)"
        LOCAL = "LOCAL", "Local filesystem (dev only)"

    class ScanStatus(models.TextChoices):
        PENDING = "PENDING", "Pending Scan"
        CLEAN = "CLEAN", "Clean"
        INFECTED = "INFECTED", "Infected"
        FAILED = "FAILED", "Scan Failed"
        SKIPPED = "SKIPPED", "Scan Skipped"

    class FileCategory(models.TextChoices):
        EMPLOYEE_DOCUMENT = "EMPLOYEE_DOCUMENT", "Employee Document"
        INVOICE = "INVOICE", "Invoice"
        PURCHASE_ORDER = "PURCHASE_ORDER", "Purchase Order"
        PRODUCT_IMAGE = "PRODUCT_IMAGE", "Product Image"
        BRANDING = "BRANDING", "Branding Asset"
        PAYSLIP = "PAYSLIP", "Payslip"
        REPORT = "REPORT", "Report Export"
        OTHER = "OTHER", "Other"

    # Storage metadata
    original_filename = models.CharField(max_length=500)
    stored_key = models.CharField(
        max_length=1000,
        help_text="S3 object key or storage path",
    )
    storage_backend = models.CharField(
        max_length=10,
        choices=StorageBackend.choices,
        default=StorageBackend.S3,
    )
    content_type = models.CharField(max_length=100)
    file_size_bytes = models.PositiveBigIntegerField()
    file_hash_sha256 = models.CharField(max_length=64, blank=True, db_index=True)

    # Classification
    category = models.CharField(
        max_length=30,
        choices=FileCategory.choices,
        default=FileCategory.OTHER,
    )

    # Ownership
    uploaded_by_id = models.UUIDField(db_index=True)

    # Linked to a resource
    linked_resource_type = models.CharField(max_length=100, blank=True)  # e.g. "hrms.Employee"
    linked_resource_id = models.UUIDField(null=True, blank=True, db_index=True)

    # Security
    scan_status = models.CharField(
        max_length=10,
        choices=ScanStatus.choices,
        default=ScanStatus.PENDING,
        db_index=True,
    )
    scanned_at = models.DateTimeField(null=True, blank=True)
    is_public = models.BooleanField(default=False)

    class Meta(TenantModel.Meta):
        db_table = "file_uploads"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["business_unit_id", "category", "is_active"]),
            models.Index(fields=["linked_resource_type", "linked_resource_id"]),
            models.Index(fields=["uploaded_by_id", "created_at"]),
        ]

    def __str__(self) -> str:
        return f"{self.original_filename} ({self.category})"

    @property
    def presigned_url_key(self) -> str:
        """Returns the key needed to generate a presigned URL."""
        return self.stored_key
