# yss_orbit\backend\apps\rbac\api\views\rbac_sub_module_view.py
"""
YSS Orbit — RbacSubModule ViewSet

Platform-level sub-module taxonomy management.

Permission model (matches RoleTemplateViewSet and RbacModuleViewSet):
  - GET: platform.roles.view
  - POST/PATCH/DELETE/actions: platform.roles.manage
"""
import logging

from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied
from rest_framework.permissions import IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response

from core.permissions.rbac_permission import HasRBACPermission
from core.responses import SuccessResponse, CreatedResponse
from apps.iam.models import RbacSubModule
from apps.iam.api.serializers.rbac_sub_module_serializer import RbacSubModuleSerializer

logger = logging.getLogger(__name__)

_READ_PERMISSION = "platform.roles.view"
_WRITE_PERMISSION = "platform.roles.manage"


class RbacSubModuleViewSet(viewsets.ModelViewSet):
    """
    CRUD for RbacSubModule — second-level taxonomy inside an RbacModule.

    Filtering:
      ?parent_module_code=<code>  → filter by parent module code
      ?include_deleted=true       → include archived sub-modules
      ?include_inactive=true      → include inactive sub-modules
    """

    serializer_class = RbacSubModuleSerializer
    permission_classes = [IsAuthenticated, HasRBACPermission]
    required_permissions = [_READ_PERMISSION]
    filter_backends = [DjangoFilterBackend]

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
            RbacSubModule.all_objects.all()
            if include_deleted
            else RbacSubModule.objects.all()
        ).select_related("parent_module").order_by("parent_module__title", "title")

        if action_ == "list" and self.request.query_params.get("include_inactive") != "true":
            qs = qs.filter(is_active=True)

        parent_module_code = self.request.query_params.get("parent_module_code")
        if parent_module_code:
            qs = qs.filter(parent_module__code=parent_module_code)

        return qs

    # ── Write overrides ─────────────────────────────────────────────────────

    def create(self, request: Request, *args, **kwargs) -> Response:
        self._require_write_permission(request)
        serializer = self.get_serializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        sub = serializer.save(
            created_by_id=request.user.id,
            updated_by_id=request.user.id,
        )
        return CreatedResponse(
            data=RbacSubModuleSerializer(sub, context={"request": request}).data,
            message="Sub-module created successfully.",
        )

    def update(self, request: Request, *args, **kwargs) -> Response:
        self._require_write_permission(request)
        partial = kwargs.pop("partial", False)
        instance = self.get_object()
        serializer = self.get_serializer(
            instance, data=request.data, partial=partial, context={"request": request}
        )
        serializer.is_valid(raise_exception=True)
        sub = serializer.save(updated_by_id=request.user.id)
        return SuccessResponse(
            data=RbacSubModuleSerializer(sub, context={"request": request}).data,
            message="Sub-module updated successfully.",
        )

    def partial_update(self, request: Request, *args, **kwargs) -> Response:
        kwargs["partial"] = True
        return self.update(request, *args, **kwargs)

    def destroy(self, request: Request, *args, **kwargs) -> Response:
        """Archive (soft-delete) or permanently delete (hard=true for super admins)."""
        self._require_write_permission(request)
        sub = self.get_object()

        hard_delete = request.query_params.get("hard") == "true"

        if hard_delete:
            if not getattr(request.user, "is_super_admin", False):
                return Response(
                    {"detail": "Only Super Admins can permanently delete sub-modules."},
                    status=status.HTTP_403_FORBIDDEN,
                )
            
            logger.warning("SuperAdmin %s permanently deleting RbacSubModule %s (id=%s)", request.user.id, sub.code, sub.id)
            sub.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
            
        return Response(
            {"detail": "Hard deletion is not permitted by default. Use POST /archive/ to archive this sub-module, or ?hard=true if you are a Super Admin."},
            status=status.HTTP_405_METHOD_NOT_ALLOWED,
        )

    # ── Custom actions ──────────────────────────────────────────────────────

    @action(detail=True, methods=["post"])
    def archive(self, request: Request, pk=None) -> Response:
        """Soft-delete (archive) a sub-module."""
        self._require_write_permission(request)
        sub = self.get_object()
        if sub.is_deleted:
            return Response(
                {"detail": "This sub-module is already archived."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        sub.soft_delete(deleted_by_id=request.user.id)
        logger.info("RbacSubModule %s (id=%s) archived by %s", sub.code, sub.id, request.user.id)
        return SuccessResponse(
            data=RbacSubModuleSerializer(sub, context={"request": request}).data,
            message="Sub-module archived successfully.",
        )

    @action(detail=True, methods=["post"])
    def restore(self, request: Request, pk=None) -> Response:
        """Restore an archived sub-module."""
        self._require_write_permission(request)
        sub = RbacSubModule.all_objects.filter(pk=pk, is_deleted=True).first()
        if not sub:
            return Response(
                {"detail": "Sub-module not found or is not archived."},
                status=status.HTTP_404_NOT_FOUND,
            )
        sub.restore()
        sub.updated_by_id = request.user.id
        sub.save(update_fields=["updated_by_id"])
        logger.info("RbacSubModule %s (id=%s) restored by %s", sub.code, sub.id, request.user.id)
        return SuccessResponse(
            data=RbacSubModuleSerializer(sub, context={"request": request}).data,
            message="Sub-module restored successfully.",
        )
