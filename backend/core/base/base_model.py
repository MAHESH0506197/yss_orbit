# yss_orbit\backend\core\base\base_model.py
import uuid
from typing import Any

from django.db import models
from django.utils import timezone

class SoftDeleteQuerySet(models.QuerySet):
    def alive(self) -> "SoftDeleteQuerySet":
        return self.filter(is_deleted=False)

    def deleted(self) -> "SoftDeleteQuerySet":
        return self.filter(is_deleted=True)

    def soft_delete(self, deleted_by_id: uuid.UUID | None = None) -> int:
        now = timezone.now()
        return self.update(
            is_deleted=True,
            deleted_at=now,
            deleted_by_id=deleted_by_id,
            is_active=False,
        )

    def restore(self) -> int:
        return self.update(
            is_deleted=False,
            deleted_at=None,
            deleted_by_id=None,
            is_active=True,
        )

class SoftDeleteManager(models.Manager):
    def get_queryset(self) -> SoftDeleteQuerySet:
        return SoftDeleteQuerySet(self.model, using=self._db).alive()

    def including_deleted(self) -> SoftDeleteQuerySet:
        return SoftDeleteQuerySet(self.model, using=self._db)

class AllObjectsManager(models.Manager):
    def get_queryset(self) -> SoftDeleteQuerySet:
        return SoftDeleteQuerySet(self.model, using=self._db)

class BaseModel(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False, db_index=True)
    is_active = models.BooleanField(default=True, db_index=True)
    is_deleted = models.BooleanField(default=False, db_index=True)
    deleted_at = models.DateTimeField(null=True, blank=True)
    deleted_by_id = models.UUIDField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by_id = models.UUIDField(null=True, blank=True)
    updated_by_id = models.UUIDField(null=True, blank=True)

    objects = SoftDeleteManager()
    all_objects = AllObjectsManager()

    class Meta:
        abstract = True
        ordering = ["-created_at"]
        get_latest_by = "created_at"

    def soft_delete(self, deleted_by_id: uuid.UUID | None = None, save: bool = True) -> None:
        self.is_deleted = True
        self.is_active = False
        self.deleted_at = timezone.now()
        self.deleted_by_id = deleted_by_id
        if save:
            self.save(update_fields=["is_deleted", "is_active", "deleted_at", "deleted_by_id", "updated_at"])

    def restore(self, save: bool = True) -> None:
        self.is_deleted = False
        self.is_active = True
        self.deleted_at = None
        self.deleted_by_id = None
        if save:
            self.save(update_fields=["is_deleted", "is_active", "deleted_at", "deleted_by_id", "updated_at"])

    def __repr__(self) -> str:
        return f"<{self.__class__.__name__} id={self.id}>"

class PlatformModel(BaseModel):
    class Meta(BaseModel.Meta):
        abstract = True

class AuditModel(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        abstract = True
        ordering = ["-created_at"]

    def save(self, *args: Any, **kwargs: Any) -> None:
        if self.pk and self.__class__.objects.filter(pk=self.pk).exists():
            raise PermissionError("Audit log entries are immutable and cannot be updated.")
        super().save(*args, **kwargs)

    def delete(self, *args: Any, **kwargs: Any) -> tuple[int, dict[str, int]]:
        raise PermissionError("Audit log entries are immutable and cannot be deleted.")
