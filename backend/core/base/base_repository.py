# yss_orbit\backend\core\base\base_repository.py
"""
Base repository pattern implementation.
"""
from typing import TypeVar, Generic, Optional, Any, List
from django.db.models import Model, QuerySet
from django.core.exceptions import ObjectDoesNotExist, ValidationError
from core.exceptions import InvalidDataError
from core.responses import ResourceNotFoundException

T = TypeVar('T', bound=Model)

class BaseRepository(Generic[T]):
    """
    Base repository for database operations.
    """
    model: type[T]

    def __init__(self):
        if not hasattr(self, 'model') or not self.model:
            raise ValueError(f"{self.__class__.__name__} must define a 'model' attribute.")

    def get_queryset(self) -> QuerySet[T]:
        """Get the base queryset for the model."""
        return self.model.objects.all()

    def get_by_id(self, id: Any) -> Optional[T]:
        """Get a single record by ID."""
        try:
            return self.get_queryset().get(id=id)
        except ObjectDoesNotExist:
            return None

    def get_by_id_or_fail(self, id: Any) -> T:
        """Get a single record by ID or raise an exception."""
        instance = self.get_by_id(id)
        if not instance:
            raise ResourceNotFoundException(f"{self.model.__name__} with id {id} not found.")
        return instance

    def get_all(self) -> QuerySet[T]:
        """Get all records."""
        return self.get_queryset()

    def filter(self, **kwargs) -> QuerySet[T]:
        """Filter records by kwargs."""
        return self.get_queryset().filter(**kwargs)

    def create(self, **kwargs) -> T:
        """Create a new record."""
        try:
            instance = self.model(**kwargs)
            instance.full_clean()
            instance.save()
            return instance
        except ValidationError as e:
            raise InvalidDataError(f"Validation error creating {self.model.__name__}: {str(e)}")

    def update(self, instance: T, **kwargs) -> T:
        """Update an existing record."""
        try:
            for key, value in kwargs.items():
                setattr(instance, key, value)
            instance.full_clean()
            instance.save()
            return instance
        except ValidationError as e:
            raise InvalidDataError(f"Validation error updating {self.model.__name__}: {str(e)}")

    def delete(self, instance: T) -> None:
        """Delete a record."""
        instance.delete()
        
    def count(self, **kwargs) -> int:
        """Count records matching kwargs."""
        return self.filter(**kwargs).count()
        
    def exists(self, **kwargs) -> bool:
        """Check if records matching kwargs exist."""
        return self.filter(**kwargs).exists()
