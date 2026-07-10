# yss_orbit\backend\apps\core\repositories\base.py
"""
YSS Orbit — Base Repository
All domain repositories extend this. The repository layer:
- Handles ALL database access (no direct ORM in services or views)
- ALWAYS filters by business_unit_id (tenant isolation)
- NEVER calls transaction.atomic() (that's the service layer's job)
- Uses explicit field selection (no SELECT *)
- Raises ResourceNotFoundException when record not found
"""
from __future__ import annotations

import uuid
from typing import Any, Generic, Type, TypeVar

from django.db import models
from django.db.models import QuerySet

from apps.platform.core_exceptions import ResourceNotFoundException, TenantViolationException
from apps.platform.models.base import TenantModel

ModelType = TypeVar("ModelType", bound=models.Model)


class BaseRepository(Generic[ModelType]):
    """
    Generic base repository for tenant-scoped data access.
    All repositories must extend this and pass their model class.
    """

    model_class: Type[ModelType]

    def __init__(self, model_class: Type[ModelType]) -> None:
        self.model_class = model_class

    # ─── Read Operations ─────────────────────────────────────────────────────

    def get_by_id(
        self,
        record_id: uuid.UUID,
        business_unit_id: uuid.UUID,
        select_related: list[str] | None = None,
        prefetch_related: list[str] | None = None,
    ) -> ModelType:
        """
        Fetch a single record by ID, scoped to the business unit.
        Raises ResourceNotFoundException if not found or belongs to different BU.
        NEVER exposes cross-tenant data.
        """
        qs = self.model_class.objects.filter(
            id=record_id,
            business_unit_id=business_unit_id,
            is_deleted=False,
        )
        if select_related:
            qs = qs.select_related(*select_related)
        if prefetch_related:
            qs = qs.prefetch_related(*prefetch_related)

        try:
            return qs.get()
        except self.model_class.DoesNotExist:
            raise ResourceNotFoundException(
                resource_name=self.model_class.__name__,
            )

    def get_by_id_or_none(
        self,
        record_id: uuid.UUID,
        business_unit_id: uuid.UUID,
    ) -> ModelType | None:
        """Like get_by_id but returns None instead of raising."""
        try:
            return self.get_by_id(record_id, business_unit_id)
        except ResourceNotFoundException:
            return None

    def list(
        self,
        business_unit_id: uuid.UUID,
        filters: dict[str, Any] | None = None,
        order_by: list[str] | None = None,
        select_related: list[str] | None = None,
        prefetch_related: list[str] | None = None,
    ) -> QuerySet[ModelType]:
        """
        Return a queryset scoped to the business unit.
        Caller is responsible for applying pagination.
        Filters dict is applied as ORM kwargs.
        """
        qs = self.model_class.objects.filter(
            business_unit_id=business_unit_id,
            is_deleted=False,
        )
        if filters:
            qs = qs.filter(**filters)
        if select_related:
            qs = qs.select_related(*select_related)
        if prefetch_related:
            qs = qs.prefetch_related(*prefetch_related)
        if order_by:
            qs = qs.order_by(*order_by)
        return qs

    def exists(
        self,
        business_unit_id: uuid.UUID,
        **kwargs: Any,
    ) -> bool:
        """Check if a record exists within the business unit."""
        return self.model_class.objects.filter(
            business_unit_id=business_unit_id,
            is_deleted=False,
            **kwargs,
        ).exists()

    def count(
        self,
        business_unit_id: uuid.UUID,
        **kwargs: Any,
    ) -> int:
        """Count records within the business unit."""
        return self.model_class.objects.filter(
            business_unit_id=business_unit_id,
            is_deleted=False,
            **kwargs,
        ).count()

    # ─── Write Operations ─────────────────────────────────────────────────────

    def create(
        self,
        business_unit_id: uuid.UUID,
        data: dict[str, Any],
        created_by_id: uuid.UUID | None = None,
    ) -> ModelType:
        """
        Create a new record in the given business unit.
        Injects business_unit_id and created_by_id automatically.
        """
        data["business_unit_id"] = business_unit_id
        if created_by_id:
            data["created_by_id"] = created_by_id
        return self.model_class.objects.create(**data)

    def update(
        self,
        instance: ModelType,
        data: dict[str, Any],
        updated_by_id: uuid.UUID | None = None,
        update_fields: list[str] | None = None,
    ) -> ModelType:
        """
        Update a record instance with the provided data.
        Only updates specified fields for efficiency.
        """
        if updated_by_id:
            data["updated_by_id"] = updated_by_id

        fields_to_update: list[str] = []
        for field, value in data.items():
            setattr(instance, field, value)
            fields_to_update.append(field)

        # Always update updated_at
        fields_to_update.append("updated_at")

        if update_fields:
            # Use explicit field list if provided (most efficient)
            instance.save(update_fields=update_fields + ["updated_at"])
        else:
            instance.save(update_fields=fields_to_update)

        return instance

    def soft_delete(
        self,
        instance: ModelType,
        deleted_by_id: uuid.UUID | None = None,
    ) -> None:
        """
        Soft-delete a record. Hard delete is PROHIBITED for business data.
        """
        if hasattr(instance, "soft_delete"):
            instance.soft_delete(deleted_by_id=deleted_by_id)  # type: ignore[union-attr]
        else:
            return None(
                f"{self.model_class.__name__} does not support soft delete. "
                "Ensure it extends TenantModel or BaseModel."
            )

    def bulk_create(
        self,
        business_unit_id: uuid.UUID,
        records: list[dict[str, Any]],
        created_by_id: uuid.UUID | None = None,
        batch_size: int = 500,
    ) -> list[ModelType]:
        """
        Bulk create records. Uses batch_size=500 to avoid memory pressure.
        """
        instances = []
        for data in records:
            data["business_unit_id"] = business_unit_id
            if created_by_id:
                data["created_by_id"] = created_by_id
            instances.append(self.model_class(**data))

        return self.model_class.objects.bulk_create(
            instances,
            batch_size=batch_size,
            ignore_conflicts=False,
        )

    def bulk_update(
        self,
        instances: list[ModelType],
        fields: list[str],
        batch_size: int = 500,
    ) -> int:
        """Bulk update instances for specified fields."""
        if "updated_at" not in fields:
            fields = fields + ["updated_at"]
        return self.model_class.objects.bulk_update(
            instances,
            fields=fields,
            batch_size=batch_size,
        )


class PlatformRepository(Generic[ModelType]):
    """
    Repository for platform-level data (not tenant-scoped).
    Used for: Organizations, Plans, Modules, Feature Flags, etc.
    """

    model_class: Type[ModelType]

    def __init__(self, model_class: Type[ModelType]) -> None:
        self.model_class = model_class

    def get_by_id(self, record_id: uuid.UUID) -> ModelType:
        try:
            return self.model_class.objects.get(id=record_id, is_deleted=False)  # type: ignore[union-attr]
        except self.model_class.DoesNotExist:
            raise ResourceNotFoundException(resource_name=self.model_class.__name__)

    def get_by_field(self, **kwargs: Any) -> ModelType:
        try:
            return self.model_class.objects.get(**kwargs)
        except self.model_class.DoesNotExist:
            raise ResourceNotFoundException(resource_name=self.model_class.__name__)

    def list(
        self,
        filters: dict[str, Any] | None = None,
        order_by: list[str] | None = None,
    ) -> QuerySet[ModelType]:
        qs = self.model_class.objects.all()
        if filters:
            qs = qs.filter(**filters)
        if order_by:
            qs = qs.order_by(*order_by)
        return qs

    def create(
        self,
        data: dict[str, Any],
        created_by_id: uuid.UUID | None = None,
    ) -> ModelType:
        if created_by_id:
            data["created_by_id"] = created_by_id
        return self.model_class.objects.create(**data)

    def update(
        self,
        instance: ModelType,
        data: dict[str, Any],
        updated_by_id: uuid.UUID | None = None,
    ) -> ModelType:
        if updated_by_id:
            data["updated_by_id"] = updated_by_id
        fields: list[str] = []
        for field, value in data.items():
            setattr(instance, field, value)
            fields.append(field)
        fields.append("updated_at")
        instance.save(update_fields=fields)
        return instance

    def exists(self, **kwargs: Any) -> bool:
        return self.model_class.objects.filter(**kwargs).exists()
