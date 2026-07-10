from rest_framework.exceptions import PermissionDenied

class TenantIsolationMixin:
    """
    Mixin for DRF Views/ViewSets to ensure queries are strictly isolated by the requested tenant.
    This enforces the B02 Multi-Tenant isolation rule.
    """

    def get_queryset(self):
        """
        Overrides get_queryset to strictly filter by the tenant associated with the request.
        """
        # Ensure we're calling the parent get_queryset if it exists
        if hasattr(super(), 'get_queryset'):
            queryset = super().get_queryset()
        else:
            # Fallback if super() doesn't have get_queryset, use self.queryset
            queryset = getattr(self, 'queryset', None)
            if queryset is None:
                # If there's no queryset defined, we can't filter
                return None
            queryset = queryset.all()

        # Extract tenant from request
        request = getattr(self, 'request', None)
        if not request:
            return queryset.none()
            
        # The tenant could be set on the request by middleware or permissions,
        # or extracted from headers/URL kwargs.
        
        tenant_id = None
        
        # 1. Check if a resolved tenant object is on the request (ideal case)
        if hasattr(request, 'tenant') and request.tenant:
            tenant_id = request.tenant.id
        
        # 2. Check X-Tenant-ID header
        elif 'X-Tenant-ID' in request.headers:
            tenant_id = request.headers['X-Tenant-ID']
            
        # 3. Check URL kwargs
        elif hasattr(self, 'kwargs') and 'tenant_id' in self.kwargs:
            tenant_id = self.kwargs['tenant_id']
            
        if not tenant_id:
            # Strictly deny or return empty queryset if no tenant context is found
            # Returning none() is safer to avoid leaking cross-tenant data.
            return queryset.none()
            
        # If the user is a super admin, we might bypass isolation in some systems, 
        # but strict isolation generally requires explicit filtering even for super admins
        # unless explicitly requested otherwise. We'll enforce strictly.
        
        # Check if the user actually belongs to this tenant (unless super_admin)
        if not getattr(request.user, 'is_super_admin', False):
            user_tenants = [str(t.id) for t in getattr(request.user, 'tenants', [])]
            if str(tenant_id) not in user_tenants:
                raise PermissionDenied("You do not have access to this tenant's data.")

        # Apply the filter
        return queryset.filter(tenant_id=tenant_id)
