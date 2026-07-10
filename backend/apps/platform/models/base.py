# yss_orbit\backend\apps\core\models\base.py
"""
YSS Orbit — Core Base Models
All business models must inherit from TenantModel.
Platform/system models use BaseModel or PlatformModel.
"""
from __future__ import annotations

import uuid
from typing import Any

from django.db import models
from django.utils import timezone


# ─── Soft Delete QuerySet + Manager ─────────────────────────────────────────

class SoftDeleteQuerySet(models.QuerySet["BaseModel"]):
    """QuerySet that filters out soft-deleted records by default."""

    def alive(self) -> "SoftDeleteQuerySet":
        """Return only non-deleted records."""
        return self.filter(is_deleted=False)

    def deleted(self) -> "SoftDeleteQuerySet":
        """Return only soft-deleted records."""
        return self.filter(is_deleted=True)

    def soft_delete(self, deleted_by_id: uuid.UUID | None = None, deleted_reason: str = "") -> int:
        """Bulk soft-delete. Returns number of records updated."""
        now = timezone.now()
        return self.update(
            is_deleted=True,
            deleted_at=now,
            deleted_by_id=deleted_by_id,
            deleted_reason=deleted_reason,
            is_active=False,
        )

    def restore(self) -> int:
        """Bulk restore soft-deleted records."""
        return self.update(
            is_deleted=False,
            deleted_at=None,
            deleted_by_id=None,
            deleted_reason="",
            is_active=True,
        )


class SoftDeleteManager(models.Manager["BaseModel"]):
    """Default manager — excludes soft-deleted records."""

    def get_queryset(self) -> SoftDeleteQuerySet:
        return SoftDeleteQuerySet(self.model, using=self._db).alive()

    def including_deleted(self) -> SoftDeleteQuerySet:
        """Return all records including soft-deleted."""
        return SoftDeleteQuerySet(self.model, using=self._db)


class AllObjectsManager(models.Manager["BaseModel"]):
    """Unfiltered manager — includes soft-deleted records. Use explicitly."""

    def get_queryset(self) -> SoftDeleteQuerySet:
        return SoftDeleteQuerySet(self.model, using=self._db)


# ─── Base Model ─────────────────────────────────────────────────────────────

class BaseModel(models.Model):
    """
    Abstract base model for ALL YSS Orbit models.

    Provides:
    - UUID primary key (no sequential IDs exposed in API)
    - Soft delete (hard delete is PROHIBITED for business data)
    - Audit trails (created_by, updated_by, deleted_by)
    - Timestamps (all UTC via USE_TZ=True)
    - is_active flag for deactivation without deletion
    """

    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
        db_index=True,
    )
    is_active = models.BooleanField(default=True, db_index=True)
    is_deleted = models.BooleanField(default=False, db_index=True)
    
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    created_by_id = models.UUIDField(null=True, blank=True)
    created_reason = models.TextField(blank=True, default="")
    
    updated_at = models.DateTimeField(auto_now=True)
    updated_by_id = models.UUIDField(null=True, blank=True)
    updated_reason = models.TextField(blank=True, default="")
    
    deleted_at = models.DateTimeField(null=True, blank=True)
    deleted_by_id = models.UUIDField(null=True, blank=True)
    deleted_reason = models.TextField(blank=True, default="")

    # Default manager — excludes soft-deleted
    objects = SoftDeleteManager()
    # Unfiltered manager — includes everything (use explicitly)
    all_objects = AllObjectsManager()

    class Meta:
        abstract = True
        ordering = ["-created_at"]
        get_latest_by = "created_at"

    def soft_delete(
        self,
        deleted_by_id: uuid.UUID | None = None,
        deleted_reason: str = "",
        save: bool = True,
    ) -> None:
        """
        Soft delete this instance. Sets is_deleted=True, records deletion time.
        NEVER calls model.delete() — hard delete is PROHIBITED for business data.
        """
        self.is_deleted = True
        self.is_active = False
        self.deleted_at = timezone.now()
        self.deleted_by_id = deleted_by_id
        self.deleted_reason = deleted_reason
        if save:
            self.save(update_fields=["is_deleted", "is_active", "deleted_at", "deleted_by_id", "deleted_reason", "updated_at"])

    def restore(self, save: bool = True) -> None:
        """Restore a soft-deleted record."""
        self.is_deleted = False
        self.is_active = True
        self.deleted_at = None
        self.deleted_by_id = None
        self.deleted_reason = ""
        if save:
            self.save(update_fields=["is_deleted", "is_active", "deleted_at", "deleted_by_id", "deleted_reason", "updated_at"])

    def __repr__(self) -> str:
        return f"<{self.__class__.__name__} id={self.id}>"


# ─── Tenant Model ────────────────────────────────────────────────────────────

class TenantModel(BaseModel):
    """
    Abstract model for ALL tenant-owned business data.

    MANDATORY: business_unit_id (NOT NULL) on every tenant table.
    Repository layer ALWAYS filters by business_unit_id — never exposes cross-tenant data.

    Data classification: Tenant-Owned (B03)
    """

    business_unit_id = models.UUIDField(
        db_index=True,
        null=False,  # MANDATORY — never null
        help_text="The business unit this record belongs to. NEVER cross-tenant.",
    )

    class Meta(BaseModel.Meta):
        abstract = True

    def validate_business_unit(self, expected_bu_id: uuid.UUID) -> None:
        """Raise TenantViolationException if this record doesn't belong to expected BU."""
        if str(self.business_unit_id) != str(expected_bu_id):
            from apps.platform.core_exceptions import TenantViolationException
            raise TenantViolationException(
                details={
                    "record_business_unit_id": str(self.business_unit_id),
                    "expected_business_unit_id": str(expected_bu_id),
                }
            )


# ─── Platform Model ──────────────────────────────────────────────────────────

class PlatformModel(BaseModel):
    """
    Abstract model for platform-level data (not tenant-specific).
    Examples: Organizations, Subscription Plans, Module Registry, Feature Flags.

    Data classification: Platform (B03)
    """

    class Meta(BaseModel.Meta):
        abstract = True


# ─── Immutable Audit Model ────────────────────────────────────────────────────

class AuditModel(models.Model):
    """
    Abstract model for audit log entries.
    Append-only — NO update, NO delete at application level.
    DB-level REVOKE UPDATE, DELETE should be applied in production.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        abstract = True
        ordering = ["-created_at"]

    def save(self, *args: Any, **kwargs: Any) -> None:
        """Prevent updates — audit logs are append-only."""
        if self.pk and self.__class__.objects.filter(pk=self.pk).exists():
            raise PermissionError(
                "Audit log entries are immutable and cannot be updated."
            )
        super().save(*args, **kwargs)

    def delete(self, *args: Any, **kwargs: Any) -> tuple[int, dict[str, int]]:
        """Prevent deletion — audit logs are append-only."""
        raise PermissionError(
            "Audit log entries are immutable and cannot be deleted."
        )
