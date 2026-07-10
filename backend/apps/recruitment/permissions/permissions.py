# yss_orbit\backend\apps\recruitment\permissions\permissions.py
from rest_framework.permissions import BasePermission

class IsModuleAdmin(BasePermission):
    """
    Allows access only to admin users.
    """
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.is_staff)

class IsModuleManager(BasePermission):
    """
    Allows access to managers or admins.
    """
    def has_permission(self, request, view):
        return bool(
            request.user and request.user.is_authenticated and 
            (request.user.is_staff or getattr(request.user, 'role', '') in ['manager', 'admin'])
        )
