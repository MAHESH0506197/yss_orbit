# yss_orbit\backend\core\base\base_viewset.py
"""
Base viewsets.
"""
from rest_framework import viewsets
from core.responses import SuccessResponse, CreatedResponse, NoContentResponse
from core.responses.paginated_response import StandardPagination

class BaseViewSet(viewsets.ModelViewSet):
    """
    Base ModelViewSet with standardized responses.
    """
    pagination_class = StandardPagination

    def get_queryset(self):
        queryset = super().get_queryset()
        if hasattr(queryset.model, 'business_unit_id'):
            from core.tenancy.tenant_context import get_current_tenant_id
            tenant_id = get_current_tenant_id()
            if tenant_id:
                queryset = queryset.filter(business_unit_id=tenant_id)
        return queryset

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        page = self.paginate_queryset(queryset)
        
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(queryset, many=True)
        return SuccessResponse(data=serializer.data, message="Records retrieved successfully")

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        return SuccessResponse(data=serializer.data, message="Record retrieved successfully")

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        return CreatedResponse(data=serializer.data, message="Record created successfully")

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)

        if getattr(instance, '_prefetched_objects_cache', None):
            instance._prefetched_objects_cache = {}

        return SuccessResponse(data=serializer.data, message="Record updated successfully")

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        
        # Support reason for deletion via query param or body
        reason = request.data.get('reason') or request.query_params.get('reason', '')
        
        if hasattr(instance, 'soft_delete'):
            instance.soft_delete(
                deleted_by_id=request.user.id if request.user.is_authenticated else None
            )
            # Add reason if BaseModel supports it
            if hasattr(instance, 'deleted_reason'):
                instance.deleted_reason = reason
                instance.save(update_fields=['deleted_reason'])
        else:
            self.perform_destroy(instance)
            
        return NoContentResponse(message="Record deleted successfully")

    # If you implement a restore action, it would look like this:
    # @action(detail=True, methods=['post'])
    # def restore(self, request, pk=None):
    #     ...
