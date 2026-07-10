# yss_orbit\backend\core\base\soft_delete_repository.py
"""
Soft delete repository pattern implementation.
"""
from typing import TypeVar, Any
from django.db.models import Model, QuerySet
from core.base.base_repository import BaseRepository

T = TypeVar('T', bound=Model)

class SoftDeleteRepository(BaseRepository[T]):
    """
    Repository for models that support soft deletion.
    """
    
    def get_queryset(self) -> QuerySet[T]:
        """Get the base queryset for active records only."""
        if hasattr(self.model.objects, 'alive'):
            return self.model.objects.alive()
        return self.model.objects.filter(is_deleted=False)

    def get_all_with_deleted(self) -> QuerySet[T]:
        """Get all records, including soft-deleted ones."""
        if hasattr(self.model, 'all_objects'):
            return self.model.all_objects.all()
        if hasattr(self.model.objects, 'including_deleted'):
            return self.model.objects.including_deleted()
        return self.model._default_manager.all()

    def get_deleted(self) -> QuerySet[T]:
        """Get only soft-deleted records."""
        if hasattr(self.model.objects, 'deleted'):
            return self.model.objects.deleted()
        return self.model._default_manager.filter(is_deleted=True)

    def delete(self, instance: T) -> None:
        """Soft delete a record."""
        if hasattr(instance, 'soft_delete'):
            instance.soft_delete()
        else:
            instance.is_deleted = True
            instance.save(update_fields=['is_deleted'])

    def hard_delete(self, instance: T) -> None:
        """Permanently delete a record."""
        super().delete(instance)

    def restore(self, instance: T) -> T:
        """Restore a soft-deleted record."""
        if hasattr(instance, 'restore'):
            instance.restore()
        else:
            instance.is_deleted = False
            instance.save(update_fields=['is_deleted'])
        return instance
