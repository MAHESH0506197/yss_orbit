# yss_orbit\backend\apps\rbac\permissions\permissions.py
from rest_framework.permissions import BasePermission
from apps.iam.services.rbac_service import RBACService

class HasPermission(BasePermission):
    """
    Allows access only to users with the specified RBAC permission in the current BU.
    """
    def __init__(self, required_permission=None):
        self.required_permission = required_permission

    def __call__(self):
        return self

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
            
        business_unit_id = getattr(request, 'business_unit_id', None)
        if not business_unit_id:
            return False
            
        if hasattr(view, 'required_permission'):
            self.required_permission = view.required_permission
            
        if not self.required_permission:
            return True
            
        user_permissions = RBACService.get_user_permissions_as_frozenset(request.user.id, business_unit_id)
        return self.required_permission in user_permissions
