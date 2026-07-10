# yss_orbit\backend\apps\organization\permissions\permissions.py
"""
MED-02 FIX: IsMembershipAdmin was an unused permission class that was never
applied in any viewset. All views use HasRBACPermission (from core.permissions).
This file is kept as an explicit no-op stub to prevent import errors from any
cached imports, but the class itself has been removed.

If BU-membership-specific permission logic is needed in the future, it should
be implemented in apps.iam as a proper RBAC permission code and gated via
HasRBACPermission, not a custom BasePermission subclass.
"""
