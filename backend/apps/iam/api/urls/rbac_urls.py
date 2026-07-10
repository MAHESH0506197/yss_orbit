# yss_orbit\backend\apps\rbac\api\urls.py
# FIX-BUG20 (already fixed in config/urls.py): this file is mounted at ""
# (not "roles/") in config/urls.py after the BUG-20 fix.
# Resulting routes (all from /api/v1/):
#   GET/POST          /api/v1/roles/               → RoleViewSet
#   GET/PATCH/DELETE  /api/v1/roles/{id}/
#   POST              /api/v1/roles/{id}/restore/
#   GET               /api/v1/permissions/          → PermissionViewSet (read-only)
#   GET               /api/v1/permissions/{id}/
#   GET               /api/v1/permissions/modules/
#   GET/POST          /api/v1/user-roles/           → UserRoleViewSet (FIX-BUG35, item 2)
#   GET               /api/v1/user-roles/{id}/
#   DELETE            /api/v1/user-roles/{id}/       (revoke)
#   POST              /api/v1/user-roles/{id}/restore/
#
# BUG-20 caution: router.register(r"user-roles", ...) added BEFORE roles
# and permissions below to ensure specificity-ordering is unambiguous
# (DefaultRouter generates more-specific prefixes first in registration
# order; "user-roles" is more specific than the action-routes of "roles").
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from apps.iam.api.views.role_view import RoleViewSet
from apps.iam.api.views.permission_view import PermissionViewSet
from apps.iam.api.views.user_role_view import UserRoleViewSet
from apps.iam.api.views.role_template_view import RoleTemplateViewSet
from apps.iam.api.views.rbac_module_view import RbacModuleViewSet
from apps.iam.api.views.rbac_sub_module_view import RbacSubModuleViewSet

router = DefaultRouter()
router.register(r"user-roles", UserRoleViewSet, basename="user-roles")
router.register(r"roles", RoleViewSet, basename="roles")
router.register(r"permissions", PermissionViewSet, basename="permissions")
router.register(r"role-templates", RoleTemplateViewSet, basename="role-templates")
router.register(r"rbac-modules", RbacModuleViewSet, basename="rbac-modules")
router.register(r"rbac-sub-modules", RbacSubModuleViewSet, basename="rbac-sub-modules")

urlpatterns = [
    path("", include(router.urls)),
]
