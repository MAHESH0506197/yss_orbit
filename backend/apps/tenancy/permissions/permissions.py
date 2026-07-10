# yss_orbit\backend\apps\subscription\permissions\permissions.py
from rest_framework.permissions import BasePermission
import logging

logger = logging.getLogger(__name__)

class HasActiveSubscription(BasePermission):
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        if request.user.is_superuser:
            return True
        tenant = getattr(request.user, 'tenant', None)
        if not tenant:
            return False
        
        # Strict SaaS subscription gating
        subscription = getattr(tenant, 'subscription', None)
        if not subscription or not subscription.is_active:
            logger.warning(f"Tenant {tenant.id} denied access: No active subscription.")
            return False
        return True
