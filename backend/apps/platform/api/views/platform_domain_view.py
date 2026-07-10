import logging
from rest_framework import permissions
from core.base.base_viewset import BaseViewSet
from apps.platform.models import BrandConfiguration
from apps.platform.api.serializers.platform_domain_serializer import PlatformDomainSerializer
from apps.compliance.services.audit_service import log_action

logger = logging.getLogger(__name__)

class PlatformDomainPermission(permissions.BasePermission):
    """
    Checks if the user has super_admin privileges OR platform.domains.* permissions.
    """
    def has_permission(self, request, view):
        sec_ctx = getattr(request, 'security_context', None)
        if not sec_ctx:
            return False
            
        if sec_ctx.is_super_admin:
            return True
            
        # For MVP, fallback to super_admin as per instructions
        return False

class PlatformDomainViewSet(BaseViewSet):
    """
    Platform Admin API for managing domains across all tenants.
    Reads from BrandConfiguration.
    """
    serializer_class = PlatformDomainSerializer
    permission_classes = [permissions.IsAuthenticated, PlatformDomainPermission]

    def get_queryset(self):
        # Platform Admins can see ALL domains across ALL business units
        # We only care about BrandConfigurations that have a custom domain configured
        return BrandConfiguration.objects.exclude(custom_domain__isnull=True).exclude(custom_domain='')
        
    def perform_create(self, serializer):
        # Admin shouldn't really 'create' a brand config here, but if they do, we'll save it.
        instance = serializer.save()
        
        # Audit Log
        log_action(
            action="Custom Domain Created",
            resource_type="BrandConfiguration",
            user_id=self.request.security_context.effective_user_id,
            user_username=getattr(self.request.user, 'username', 'system'),
            business_unit_id=instance.business_unit_id,
            resource_id=instance.id,
            resource_display=instance.custom_domain,
            new_values=serializer.data,
            endpoint=self.request.path,
            http_method=self.request.method
        )
        
    def perform_update(self, serializer):
        old_instance = self.get_object()
        old_values = PlatformDomainSerializer(old_instance).data
        
        instance = serializer.save()
        
        # Determine specific audit actions
        actions = ["Custom Domain Updated"]
        if old_instance.domain_status != instance.domain_status:
            actions.append("Verification Status Changed")
        if old_instance.ssl_status != instance.ssl_status:
            actions.append("SSL Status Changed")
            
        for action in actions:
            log_action(
                action=action,
                resource_type="BrandConfiguration",
                user_id=self.request.security_context.effective_user_id,
                user_username=getattr(self.request.user, 'username', 'system'),
                business_unit_id=instance.business_unit_id,
                resource_id=instance.id,
                resource_display=instance.custom_domain,
                old_values=old_values,
                new_values=serializer.data,
                endpoint=self.request.path,
                http_method=self.request.method
            )

    def perform_destroy(self, instance):
        old_values = PlatformDomainSerializer(instance).data
        
        # We don't delete the BrandConfiguration, we just clear the domain fields
        instance.custom_domain = None
        instance.domain_status = 'pending'
        instance.ssl_status = 'pending'
        instance.save()
        
        log_action(
            action="Custom Domain Removed",
            resource_type="BrandConfiguration",
            user_id=self.request.security_context.effective_user_id,
            user_username=getattr(self.request.user, 'username', 'system'),
            business_unit_id=instance.business_unit_id,
            resource_id=instance.id,
            resource_display=old_values.get('name'),
            old_values=old_values,
            endpoint=self.request.path,
            http_method=self.request.method
        )

