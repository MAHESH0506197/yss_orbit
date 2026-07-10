# yss_orbit\backend\core\base\base_view.py
"""
Base views and generics for standard REST operations.
"""
from rest_framework import generics
from core.responses import SuccessResponse, CreatedResponse, NoContentResponse
from core.responses.paginated_response import StandardPagination

class BaseListCreateAPIView(generics.ListCreateAPIView):
    """
    Base ListCreateAPIView with standardized responses.
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

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        return CreatedResponse(data=serializer.data, message="Record created successfully")


class BaseRetrieveUpdateDestroyAPIView(generics.RetrieveUpdateDestroyAPIView):
    """
    Base RetrieveUpdateDestroyAPIView with standardized responses.
    """
    def get_queryset(self):
        queryset = super().get_queryset()
        if hasattr(queryset.model, 'business_unit_id'):
            from core.tenancy.tenant_context import get_current_tenant_id
            tenant_id = get_current_tenant_id()
            if tenant_id:
                queryset = queryset.filter(business_unit_id=tenant_id)
        return queryset

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        return SuccessResponse(data=serializer.data, message="Record retrieved successfully")

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
        self.perform_destroy(instance)
        return NoContentResponse(message="Record deleted successfully")
