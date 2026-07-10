# yss_orbit/backend/apps/subscription/api/views/platform_module_view.py
from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action
from rest_framework.response import Response

from apps.platform.core_permissions import IsSuperAdmin
from apps.tenancy.models import PlatformModule
from apps.tenancy.api.serializers.subscription_serializer import PlatformModuleSerializer

class PlatformModuleViewSet(viewsets.ModelViewSet):
    """
    Only SuperAdmins can create/update/delete modules.
    Any authenticated user can view them (to see what's available).
    """
    queryset = PlatformModule.objects.all()
    serializer_class = PlatformModuleSerializer
    lookup_field = "id"

    @action(detail=True, methods=["post"])
    def restore(self, request, id=None):
        instance = self.get_object()
        reason = request.data.get("reason", "")
        user_id = request.security_context.effective_user_id if hasattr(request, "security_context") else None
        
        instance.restored_reason = reason
        instance.restore()
        
        if user_id:
            instance.updated_by_id = user_id
            instance.save(update_fields=["updated_by_id", "restored_reason"])
            
        serializer = self.get_serializer(instance)
        return Response(serializer.data)

    def get_permissions(self):
        if self.action in ["list", "retrieve"]:
            return [IsAuthenticated()]
        return [IsSuperAdmin()]

    def perform_create(self, serializer):
        reason = self.request.data.get("reason", "")
        instance = serializer.save()
        
        user_id = self.request.security_context.effective_user_id if hasattr(self.request, "security_context") else None
        instance.created_by_id = user_id
        instance.updated_by_id = user_id
        if reason:
            instance.created_reason = reason
            instance.updated_reason = reason
        instance.save(update_fields=["created_by_id", "updated_by_id", "created_reason", "updated_reason"])

    def perform_update(self, serializer):
        reason = self.request.data.get("reason", "")
        instance = serializer.save()
        
        user_id = self.request.security_context.effective_user_id if hasattr(self.request, "security_context") else None
        instance.updated_by_id = user_id
        if reason:
            instance.updated_reason = reason
        instance.save(update_fields=["updated_by_id", "updated_reason"])

    def perform_destroy(self, instance):
        reason = self.request.data.get("reason", "")
        user_id = self.request.security_context.effective_user_id if hasattr(self.request, "security_context") else None
        instance.deleted_reason = reason
        instance.soft_delete(deleted_by_id=user_id)
