# yss_orbit\backend\core\base\tenant_repository.py
"""
Tenant-aware repository pattern implementation.
"""
from typing import TypeVar, Any, Optional
from django.db.models import Model, QuerySet
from core.base.base_repository import BaseRepository

T = TypeVar('T', bound=Model)

class TenantRepository(BaseRepository[T]):
    """
    Repository for tenant-specific operations.
    Requires passing a tenant ID or instance for most operations.
    """
    
    def get_queryset(self) -> QuerySet[T]:
        """
        By default, getting a queryset should require tenant context,
        but for base compatibility we return the standard queryset.
        In practice, methods should use get_tenant_queryset.
        """
        return super().get_queryset()

    def get_tenant_queryset(self, tenant_id: Any) -> QuerySet[T]:
        """Get the base queryset scoped to a specific tenant."""
        return self.model.objects.filter(tenant_id=tenant_id)

    def get_by_id(self, id: Any, tenant_id: Any = None) -> Optional[T]:
        """Get a single record by ID, scoped to a tenant if provided."""
        queryset = self.get_tenant_queryset(tenant_id) if tenant_id else self.get_queryset()
        return queryset.filter(id=id).first()

    def get_by_id_or_fail(self, id: Any, tenant_id: Any = None) -> T:
        """Get a single record by ID or raise an exception, scoped to a tenant."""
        instance = self.get_by_id(id, tenant_id)
        if not instance:
            from core.responses import ResourceNotFoundException
            raise ResourceNotFoundException(f"{self.model.__name__} with id {id} not found.")
        return instance

    def get_all(self, tenant_id: Any = None) -> QuerySet[T]:
        """Get all records, optionally scoped to a tenant."""
        if tenant_id:
            return self.get_tenant_queryset(tenant_id)
        return super().get_all()

    def filter(self, tenant_id: Any = None, **kwargs) -> QuerySet[T]:
        """Filter records by kwargs, optionally scoped to a tenant."""
        queryset = self.get_tenant_queryset(tenant_id) if tenant_id else self.get_queryset()
        return queryset.filter(**kwargs)
        
    def count(self, tenant_id: Any = None, **kwargs) -> int:
        """Count records matching kwargs, optionally scoped to a tenant."""
        return self.filter(tenant_id=tenant_id, **kwargs).count()
        
    def exists(self, tenant_id: Any = None, **kwargs) -> bool:
        """Check if records matching kwargs exist, optionally scoped to a tenant."""
        return self.filter(tenant_id=tenant_id, **kwargs).exists()
