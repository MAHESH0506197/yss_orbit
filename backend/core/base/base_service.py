# yss_orbit\backend\core\base\base_service.py
"""
Base service layer implementation.
"""
from typing import TypeVar, Generic, Any, List
from django.db import transaction
from core.base.base_repository import BaseRepository

T = TypeVar('T')
R = TypeVar('R', bound=BaseRepository)

class BaseService(Generic[T, R]):
    """
    Base service layer class.
    Coordinates business logic between views and repositories.
    """
    repository: R

    def __init__(self, repository: R = None):
        if repository is not None:
            self.repository = repository
        elif not hasattr(self, 'repository'):
            raise ValueError(f"{self.__class__.__name__} must define a 'repository' attribute or pass it in __init__.")

    def get_by_id(self, id: Any) -> T:
        """Get a single record by ID."""
        return self.repository.get_by_id(id)

    def get_by_id_or_fail(self, id: Any) -> T:
        """Get a single record by ID or fail."""
        return self.repository.get_by_id_or_fail(id)

    def get_all(self):
        """Get all records."""
        return self.repository.get_all()

    @transaction.atomic
    def create(self, **kwargs) -> T:
        """Create a new record."""
        return self.repository.create(**kwargs)

    @transaction.atomic
    def update(self, id: Any, **kwargs) -> T:
        """Update an existing record."""
        instance = self.repository.get_by_id_or_fail(id)
        return self.repository.update(instance, **kwargs)

    @transaction.atomic
    def delete(self, id: Any) -> None:
        """Delete a record."""
        instance = self.repository.get_by_id_or_fail(id)
        self.repository.delete(instance)
