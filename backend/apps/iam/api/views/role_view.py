# yss_orbit\backend\apps\rbac\api\views\role_view.py
"""
YSS Orbit — Role ViewSet
B07 §5.3: All protected endpoints MUST have permission checks. Deny by default.
B07 §7: Missing permission check = CRITICAL violation.

Permission model:
  GET  list/retrieve       → rbac.role.view
  POST create              → rbac.role.create
  PATCH update             → rbac.role.update
  DELETE destroy           → rbac.role.delete
  POST restore             → rbac.role.restore   (custom action)

Super-admins bypass all checks per HasRBACPermission logic.
"""
import logging
from django.db.models import Count, Q
from django.utils import timezone
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied
from rest_framework.permissions import IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.filters import SearchFilter
from rest_framework.parsers import MultiPartParser
from django_filters.rest_framework import DjangoFilterBackend
from django.http import HttpResponse

from core.base.base_viewset import BaseViewSet
from core.responses import SuccessResponse, CreatedResponse, NoContentResponse
from core.permissions.rbac_permission import HasRBACPermission
from apps.iam.security_context import SecurityContext
from apps.iam.models.rbac_models import Role
from apps.iam.api.serializers.role_serializer import RoleSerializer, RoleListSerializer
from apps.iam.services.role_service import RoleService

logger = logging.getLogger(__name__)

# Map each write action to the permission code it requires.
_WRITE_PERMISSIONS: dict[str, str] = {
    "create":  "rbac.role.create",
    "update":  "rbac.role.update",
    "partial_update": "rbac.role.update",
    "destroy": "rbac.role.delete",
    "restore": "rbac.role.restore",
}


class RoleViewSet(BaseViewSet):
    """
    Enterprise-grade ViewSet for Role management.
    RBAC-enforced: requires IsAuthenticated + RBAC permission check.

    Required permissions (B07 §5.16 taxonomy):
      - List/Retrieve:  rbac.role.view
      - Create:         rbac.role.create
      - Update:         rbac.role.update
      - Delete:         rbac.role.delete
      - Restore:        rbac.role.restore
    Super admins bypass individual permission check per HasRBACPermission logic.
    """
    permission_classes = [IsAuthenticated, HasRBACPermission]
    required_permissions = ["rbac.role.view"]
    service = RoleService()

    filter_backends = [DjangoFilterBackend, SearchFilter]
    search_fields = ["name", "description"]
    filterset_fields = ["business_unit_id", "role_type", "is_active", "is_default"]

    # ── Permission helpers ──────────────────────────────────────────────────

    def _require_write_permission(self, request: Request, action_override: str = None) -> None:
        """Raise PermissionDenied if the caller lacks the action-level write permission."""
        if getattr(request.user, "is_super_admin", False):
            return
        
        action_name = action_override or self.action
        
        # If exporting matrix, we require view permission.
        # If importing, we require create. 
        if action_name == "list":
            required = "rbac.role.view"
        else:
            required = _WRITE_PERMISSIONS.get(action_name)
            
        if not required:
            return
            
        sc = getattr(request, "security_context", None)
        if sc is None or required not in sc.permissions:
            raise PermissionDenied(
                f"This action requires the '{required}' permission."
            )

    # ── Queryset ────────────────────────────────────────────────────────────

    def get_serializer_class(self):
        if self.action == "list":
            return RoleListSerializer
        return RoleSerializer

    def get_queryset(self):
        """
        Multi-tenant filtered queryset for Roles.

        BUG-RP-01 fix: roles are always filtered by business_unit_id server-side.
        - Super-admins: honour ?business_unit_id= if provided, else return all.
        - Non-super-admins: MUST supply X-Business-Unit-Id header; if missing,
          log a warning and return an empty queryset (never leak cross-BU data).
        """
        user = self.request.user

        qs = Role.all_objects.all()
        is_deleted_param = self.request.query_params.get("is_deleted")
        if is_deleted_param is None:
            action_ = getattr(self, "action", None)
            if action_ == "destroy" and self.request.query_params.get("hard") == "true":
                pass # Include soft deleted roles so we can hard delete them
            elif action_ == "restore":
                pass
            else:
                qs = qs.filter(is_deleted=False)
        elif is_deleted_param.lower() in ("true", "1", "yes"):
            qs = qs.filter(is_deleted=True)
        elif is_deleted_param.lower() in ("false", "0", "no"):
            qs = qs.filter(is_deleted=False)
        elif is_deleted_param.lower() == "all":
            pass # Return all
            
        action_ = getattr(self, "action", None)
        if action_ in ("list", "retrieve", "create", "update", "partial_update", "restore"):
            qs = qs.select_related("source_template").prefetch_related("permissions")

        if getattr(user, "is_super_admin", False):
            # Super-admin can scope by BU via query param for convenience.
            bu_id = self.request.query_params.get("business_unit_id") or \
                    self.request.headers.get("X-Business-Unit-Id")
            if bu_id:
                qs = qs.filter(business_unit_id=bu_id)
            return qs

        # Standard users: enforce BU scoping via header.
        business_unit_id = self.request.headers.get("X-Business-Unit-Id")
        if not business_unit_id:
            logger.warning(
                "RoleViewSet.get_queryset: non-super-admin user %s made request "
                "without X-Business-Unit-Id header — returning empty queryset.",
                user.id,
            )
            return Role.objects.none()

        return qs.filter(business_unit_id=business_unit_id)

    # ── List ────────────────────────────────────────────────────────────────

    def list(self, request: Request, *args, **kwargs) -> Response:
        queryset = self.filter_queryset(self.get_queryset())

        # Calculate stats for the dashboard.
        agg = queryset.aggregate(
            total=Count("id"),
            system=Count("id", filter=Q(role_type=Role.RoleType.SYSTEM)),
            custom=Count("id", filter=Q(role_type=Role.RoleType.CUSTOM)),
        )
        stats = {k: v or 0 for k, v in agg.items()}

        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            paginated = self.get_paginated_response(serializer.data)
            meta = paginated.data.get("meta", {})
            meta.update(stats)
            paginated.data["meta"] = meta
            return paginated

        serializer = self.get_serializer(queryset, many=True)
        return SuccessResponse(data=serializer.data, meta=stats)

    # ── Create ──────────────────────────────────────────────────────────────

    def create(self, request: Request, *args, **kwargs) -> Response:
        # BUG-RP-06 fix: action-level permission check.
        self._require_write_permission(request)

        serializer = self.get_serializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)

        validated_data = serializer.validated_data
        permission_ids = validated_data.pop("permissions", [])
        business_unit_id = validated_data.get("business_unit_id")

        ctx = getattr(request, "security_context", None)
        if not ctx:
            from apps.iam.security_context import ANONYMOUS_CONTEXT
            ctx = ANONYMOUS_CONTEXT

        # BUG-RP-08 fix: pass module_code to create_role service.
        role = self.service.create_role(
            security_context=ctx,
            business_unit_id=business_unit_id,
            name=validated_data.get("name"),
            description=validated_data.get("description", ""),
            is_default=validated_data.get("is_default", False),
            module_code=validated_data.get("module_code"),
            department_name=validated_data.get("department_name"),
        )

        if permission_ids:
            self.service.assign_permissions(ctx, role.id, [p.id for p in permission_ids])

        role = Role.objects.select_related("source_template").prefetch_related("permissions").get(id=role.id)
        return CreatedResponse(
            data=RoleSerializer(role, context={"request": request}).data,
            message="Role created successfully.",
        )

    # ── Update ──────────────────────────────────────────────────────────────

    def update(self, request: Request, *args, **kwargs) -> Response:
        # BUG-RP-06 fix: action-level permission check.
        self._require_write_permission(request)

        partial = kwargs.pop("partial", False)
        instance = self.get_object()
        serializer = self.get_serializer(
            instance, data=request.data, partial=partial, context={"request": request}
        )
        serializer.is_valid(raise_exception=True)

        validated_data = serializer.validated_data
        permission_ids = validated_data.pop("permissions", None)

        ctx = getattr(request, "security_context", None)
        if not ctx:
            from apps.iam.security_context import ANONYMOUS_CONTEXT
            ctx = ANONYMOUS_CONTEXT

        role = self.service.update_role(
            security_context=ctx,
            role_id=instance.id,
            data=validated_data,
        )

        if permission_ids is not None:
            self.service.assign_permissions(ctx, role.id, [p.id for p in permission_ids])

        role = Role.objects.select_related("source_template").prefetch_related("permissions").get(id=role.id)
        return SuccessResponse(
            data=RoleSerializer(role, context={"request": request}).data,
            message="Role updated successfully.",
        )

    def partial_update(self, request: Request, *args, **kwargs) -> Response:
        kwargs["partial"] = True
        return self.update(request, *args, **kwargs)

    # ── Destroy ─────────────────────────────────────────────────────────────

    def destroy(self, request: Request, *args, **kwargs) -> Response:
        # BUG-RP-06 fix: action-level permission check.
        self._require_write_permission(request)

        instance = self.get_object()

        is_hard = request.query_params.get("hard") == "true"
        if is_hard:
            if not getattr(request.user, "is_super_admin", False):
                raise PermissionDenied("Only super admins can permanently delete roles.")
            instance.delete()
            return SuccessResponse(message="Role permanently deleted.")

        ctx = getattr(request, "security_context", None)
        if not ctx:
            from apps.iam.security_context import ANONYMOUS_CONTEXT
            ctx = ANONYMOUS_CONTEXT

        self.service.delete_role(security_context=ctx, role_id=instance.id)
        return SuccessResponse(
            data=RoleSerializer(instance, context={"request": request}).data,
            message="Role archived successfully.",
        )

    # ── Restore ─────────────────────────────────────────────────────────────

    @action(detail=True, methods=["post"], url_path="restore")
    def restore(self, request: Request, *args, **kwargs) -> Response:
        """
        Restore a soft-deleted (archived) Role.

        Only CUSTOM roles can be restored via API — SYSTEM roles are never
        soft-deleted through the API (they are managed exclusively by sync_rbac).
        """
        # BUG-RP-06 fix: action-level permission check.
        self._require_write_permission(request)

        role = Role.all_objects.filter(pk=kwargs.get("pk"), is_deleted=True).first()
        if not role:
            return Response(
                {"detail": "Role not found or is not archived."},
                status=status.HTTP_404_NOT_FOUND,
            )

        if role.role_type == Role.RoleType.SYSTEM:
            return Response(
                {"detail": "System roles cannot be restored via the API."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        ctx = getattr(request, "security_context", None)
        if not ctx:
            from apps.iam.security_context import ANONYMOUS_CONTEXT
            ctx = ANONYMOUS_CONTEXT

        from django.db import transaction as db_transaction
        with db_transaction.atomic():
            role.restore()
            role.updated_by_id = ctx.effective_user_id
            role.save(update_fields=["updated_by_id"])

        logger.info(
            "Restored role (id=%s, name=%s) by user %s",
            role.id, role.name, request.user.id,
        )

        role = Role.objects.select_related("source_template").prefetch_related("permissions").get(id=role.id)
        return SuccessResponse(
            data=RoleSerializer(role, context={"request": request}).data,
            message="Role restored successfully.",
        )

    # ── Excel Bulk Import / Export ──────────────────────────────────────────

    @action(detail=False, methods=["get"], url_path="export-matrix")
    def export_matrix(self, request: Request, *args, **kwargs) -> HttpResponse:
        """
        Export a Role-Permission Matrix Excel template.
        Requires rbac.role.view permission.
        """
        # We can re-use the view permission for downloading the template
        self._require_write_permission(request, action_override="list")
        
        from apps.iam.services.matrix_service import MatrixService
        excel_buffer = MatrixService.export_matrix()
        
        response = HttpResponse(
            excel_buffer.getvalue(),
            content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        )
        response['Content-Disposition'] = 'attachment; filename="Role_Permission_Matrix.xlsx"'
        return response

    @action(detail=False, methods=["post"], url_path="import-matrix", parser_classes=[MultiPartParser])
    def import_matrix(self, request: Request, *args, **kwargs) -> Response:
        """
        Upload and parse a Role-Permission Matrix Excel file.
        Requires rbac.role.create permission.
        """
        self._require_write_permission(request, action_override="create")
        
        excel_file = request.FILES.get('file')
        if not excel_file:
            return Response({"detail": "No file uploaded."}, status=status.HTTP_400_BAD_REQUEST)
            
        ctx = getattr(request, "security_context", None)
        if not ctx or not ctx.business_unit_id:
            return Response({"detail": "Business Unit context required."}, status=status.HTTP_400_BAD_REQUEST)

        from apps.iam.services.matrix_service import MatrixService
        try:
            result = MatrixService.import_matrix(
                business_unit_id=ctx.business_unit_id,
                file_obj=excel_file,
                user_id=ctx.effective_user_id
            )
            return SuccessResponse(data=result, message="Matrix imported successfully.")
        except Exception as e:
            logger.exception("Failed to import matrix")
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)
