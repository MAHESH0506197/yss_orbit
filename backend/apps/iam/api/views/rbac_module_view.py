# yss_orbit\backend\apps\rbac\api\views\rbac_module_view.py
"""
YSS Orbit — RbacModule ViewSet

Platform-level module taxonomy management.

Permission model (matches RoleTemplateViewSet):
  - GET: platform.roles.view
  - POST/PATCH/DELETE/actions: platform.roles.manage

RbacModules are platform-global (not tenant-scoped) — they define the
top-level taxonomy groupings for Role Templates (e.g. "HR & Payroll").
"""
import logging

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied
from rest_framework.permissions import IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response

from core.permissions.rbac_permission import HasRBACPermission
from core.responses import SuccessResponse, CreatedResponse
from apps.iam.models import RbacModule
from apps.iam.api.serializers.rbac_module_serializer import RbacModuleSerializer

logger = logging.getLogger(__name__)

_READ_PERMISSION = "platform.roles.view"
_WRITE_PERMISSION = "platform.roles.manage"


class RbacModuleViewSet(viewsets.ModelViewSet):
    """
    CRUD for RbacModule — top-level taxonomy groupings for Role Templates.

    GET  /rbac-modules/          → list active modules
    GET  /rbac-modules/?include_deleted=true  → list all (for admin)
    POST /rbac-modules/          → create (requires manage)
    PATCH /rbac-modules/{id}/    → update (requires manage)
    POST /rbac-modules/{id}/archive/ → soft-delete (requires manage)
    POST /rbac-modules/{id}/restore/ → un-archive (requires manage)
    """

    serializer_class = RbacModuleSerializer
    permission_classes = [IsAuthenticated, HasRBACPermission]
    required_permissions = [_READ_PERMISSION]

    # ── Permission enforcement ──────────────────────────────────────────────

    def _require_write_permission(self, request: Request) -> None:
        if getattr(request.user, "is_super_admin", False):
            return
        sc = getattr(request, "security_context", None)
        if sc is None or _WRITE_PERMISSION not in sc.permissions:
            raise PermissionDenied(
                f"This action requires the '{_WRITE_PERMISSION}' permission."
            )

    # ── Queryset ────────────────────────────────────────────────────────────

    def get_queryset(self):
        action_ = getattr(self, "action", None)
        include_deleted = (
            self.request.query_params.get("include_deleted") == "true"
            or action_ == "restore"
        )
        qs = (
            RbacModule.all_objects.all()
            if include_deleted
            else RbacModule.objects.all()
        ).order_by("title")

        # For list, filter inactive unless explicitly requested.
        if action_ == "list" and self.request.query_params.get("include_inactive") != "true":
            qs = qs.filter(is_active=True)

        return qs

    # ── Write overrides ─────────────────────────────────────────────────────

    def create(self, request: Request, *args, **kwargs) -> Response:
        self._require_write_permission(request)
        serializer = self.get_serializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        module = serializer.save(
            created_by_id=request.user.id,
            updated_by_id=request.user.id,
        )
        return CreatedResponse(
            data=RbacModuleSerializer(module, context={"request": request}).data,
            message="Module created successfully.",
        )

    def update(self, request: Request, *args, **kwargs) -> Response:
        self._require_write_permission(request)
        partial = kwargs.pop("partial", False)
        instance = self.get_object()
        serializer = self.get_serializer(
            instance, data=request.data, partial=partial, context={"request": request}
        )
        serializer.is_valid(raise_exception=True)
        module = serializer.save(updated_by_id=request.user.id)
        return SuccessResponse(
            data=RbacModuleSerializer(module, context={"request": request}).data,
            message="Module updated successfully.",
        )

    def partial_update(self, request: Request, *args, **kwargs) -> Response:
        kwargs["partial"] = True
        return self.update(request, *args, **kwargs)

    def destroy(self, request: Request, *args, **kwargs) -> Response:
        """Archive (soft-delete) or permanently delete (hard=true for super admins)."""
        self._require_write_permission(request)
        module = self.get_object()

        hard_delete = request.query_params.get("hard") == "true"

        if hard_delete:
            if not getattr(request.user, "is_super_admin", False):
                return Response(
                    {"detail": "Only Super Admins can permanently delete modules."},
                    status=status.HTTP_403_FORBIDDEN,
                )
            
            logger.warning("SuperAdmin %s permanently deleting RbacModule %s (id=%s)", request.user.id, module.code, module.id)
            module.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
            
        return Response(
            {"detail": "Hard deletion is not permitted by default. Use POST /archive/ to archive this module, or ?hard=true if you are a Super Admin."},
            status=status.HTTP_405_METHOD_NOT_ALLOWED,
        )

    # ── Custom actions ──────────────────────────────────────────────────────

    @action(detail=True, methods=["post"])
    def archive(self, request: Request, pk=None) -> Response:
        """Soft-delete (archive) a module. Sub-modules and templates are unaffected."""
        self._require_write_permission(request)
        module = self.get_object()
        if module.is_deleted:
            return Response(
                {"detail": "This module is already archived."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        module.soft_delete(deleted_by_id=request.user.id)
        logger.info("RbacModule %s (id=%s) archived by %s", module.code, module.id, request.user.id)
        return SuccessResponse(
            data=RbacModuleSerializer(module, context={"request": request}).data,
            message="Module archived successfully.",
        )

    @action(detail=True, methods=["post"])
    def restore(self, request: Request, pk=None) -> Response:
        """Restore an archived module."""
        self._require_write_permission(request)
        module = RbacModule.all_objects.filter(pk=pk, is_deleted=True).first()
        if not module:
            return Response(
                {"detail": "Module not found or is not archived."},
                status=status.HTTP_404_NOT_FOUND,
            )
        module.restore()
        module.updated_by_id = request.user.id
        module.save(update_fields=["updated_by_id"])
        logger.info("RbacModule %s (id=%s) restored by %s", module.code, module.id, request.user.id)
        return SuccessResponse(
            data=RbacModuleSerializer(module, context={"request": request}).data,
            message="Module restored successfully.",
        )
