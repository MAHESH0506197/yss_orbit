# yss_orbit\backend\apps\rbac\api\views\role_template_view.py
"""
YSS Orbit — RoleTemplate ViewSet

Enterprise-grade endpoint for platform-level Role Templates.

Permission model:
  - GET (list/retrieve): requires platform.roles.view
  - POST/PATCH/DELETE/actions: requires platform.roles.manage

Both permissions are seeded in sync_rbac.py and assigned:
  platform.roles.view   → OWNER, ADMIN, MANAGER, STAFF (read-only visibility)
  platform.roles.manage → OWNER, ADMIN only (write/admin operations)
"""
import logging

from django.db import transaction
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied
from rest_framework.permissions import IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response

from core.permissions.rbac_permission import HasRBACPermission
from core.responses import SuccessResponse, CreatedResponse
from apps.iam.models.rbac_models import RoleTemplate, RoleTemplatePermission, Permission, Role, RolePermission
from apps.iam.api.serializers.role_template_serializer import RoleTemplateSerializer

logger = logging.getLogger(__name__)

# READ operations require view, WRITE operations require manage.
_READ_PERMISSION = "platform.roles.view"
_WRITE_PERMISSION = "platform.roles.manage"
_WRITE_ACTIONS = frozenset({"create", "update", "partial_update", "destroy", "toggle_active", "restore"})


class RoleTemplateViewSet(viewsets.ModelViewSet):
    """
    CRUD for platform-level RoleTemplates.

    These are the canonical blueprints used when bootstrapping a new
    BusinessUnit's role structure (cloned into Role objects per BU).

    Soft-delete: DELETE archives the template (is_deleted=True).
    Restore: POST /role-templates/{id}/restore/ un-archives it.
    Toggle: POST /role-templates/{id}/toggle_active/ flips is_active.
    """

    serializer_class = RoleTemplateSerializer
    permission_classes = [IsAuthenticated, HasRBACPermission]
    required_permissions = [_READ_PERMISSION]  # Baseline; write actions check additionally.
    pagination_class = None  # Templates are rendered as groups in UI, need full set.

    # ── Permission enforcement ──────────────────────────────────────────────

    def _require_write_permission(self, request: Request) -> None:
        """Raise PermissionDenied if the caller lacks platform.roles.manage."""
        if getattr(request.user, "is_super_admin", False):
            return  # Super-admins bypass all checks.
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
            or (action_ == "destroy" and self.request.query_params.get("hard") == "true")
        )
        qs = RoleTemplate.all_objects.all() if include_deleted else RoleTemplate.objects.all()

        if action_ in ("list", "retrieve"):
            qs = qs.prefetch_related("permissions")

        module_code = self.request.query_params.get("module_code")
        if module_code:
            qs = qs.filter(module_code=module_code)

        return qs.order_by("module_code", "name")

    # ── Write operations ────────────────────────────────────────────────────

    @transaction.atomic
    def create(self, request: Request, *args, **kwargs) -> Response:
        self._require_write_permission(request)
        serializer = self.get_serializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)

        permissions = serializer.validated_data.pop("permissions", [])
        template = serializer.save(
            created_by_id=request.user.id,
            updated_by_id=request.user.id,
        )

        if permissions:
            RoleTemplatePermission.objects.bulk_create([
                RoleTemplatePermission(template=template, permission=perm)
                for perm in permissions
            ])

        # Re-fetch with permissions prefetched for the response.
        template.refresh_from_db()
        return CreatedResponse(
            data=RoleTemplateSerializer(template, context={"request": request}).data,
            message="Role template created successfully.",
        )

    @transaction.atomic
    def update(self, request: Request, *args, **kwargs) -> Response:
        self._require_write_permission(request)
        partial = kwargs.pop("partial", False)
        instance = self.get_object()

        serializer = self.get_serializer(
            instance, data=request.data, partial=partial, context={"request": request}
        )
        serializer.is_valid(raise_exception=True)

        permissions = serializer.validated_data.pop("permissions", None)
        instance = serializer.save(updated_by_id=request.user.id)

        if permissions is not None:
            # Full replacement — delete old, create new.
            RoleTemplatePermission.objects.filter(template=instance).delete()
            if permissions:
                RoleTemplatePermission.objects.bulk_create([
                    RoleTemplatePermission(template=instance, permission=perm)
                    for perm in permissions
                ])

        instance.refresh_from_db()
        return SuccessResponse(
            data=RoleTemplateSerializer(instance, context={"request": request}).data,
            message="Role template updated successfully.",
        )

    def partial_update(self, request: Request, *args, **kwargs) -> Response:
        kwargs["partial"] = True
        return self.update(request, *args, **kwargs)

    def destroy(self, request: Request, *args, **kwargs) -> Response:
        self._require_write_permission(request)
        instance = self.get_object()

        if request.query_params.get("hard") == "true":
            if not getattr(request.user, "is_super_admin", False):
                raise PermissionDenied("Only super admins can permanently delete role templates.")
            instance.delete()
            return SuccessResponse(message="Role template permanently deleted.")

        instance.soft_delete(deleted_by_id=request.user.id)
        return SuccessResponse(
            data=RoleTemplateSerializer(instance, context={"request": request}).data,
            message="Role template archived successfully.",
        )

    # ── Custom actions ──────────────────────────────────────────────────────

    @action(detail=True, methods=["post"])
    def restore(self, request: Request, pk=None) -> Response:
        """Restore an archived (soft-deleted) role template."""
        self._require_write_permission(request)
        # Must use all_objects to reach deleted rows.
        instance = RoleTemplate.all_objects.filter(pk=pk, is_deleted=True).first()
        if not instance:
            return Response(
                {"detail": "Template not found or is not archived."},
                status=status.HTTP_404_NOT_FOUND,
            )
        instance.restore()
        instance.updated_by_id = request.user.id
        instance.save(update_fields=["updated_by_id"])
        return SuccessResponse(
            data=RoleTemplateSerializer(instance, context={"request": request}).data,
            message="Role template restored successfully.",
        )

    @action(detail=True, methods=["post"])
    def toggle_active(self, request: Request, pk=None) -> Response:
        """
        Toggle is_active on a role template.
        An inactive template is still visible but excluded from the
        'active' filtered list; it cannot be cloned into new roles.
        """
        self._require_write_permission(request)
        instance = self.get_object()
        instance.is_active = not instance.is_active
        instance.updated_by_id = request.user.id
        # auto_now handles updated_at — only list explicitly mutable fields.
        instance.save(update_fields=["is_active", "updated_by_id"])

        state = "activated" if instance.is_active else "deactivated"
        logger.info(
            "RoleTemplate %s (id=%s) %s by user %s",
            instance.name, instance.id, state, request.user.id,
        )
        return SuccessResponse(
            data=RoleTemplateSerializer(instance, context={"request": request}).data,
            message=f"Role template {state} successfully.",
        )

    @action(detail=True, methods=["post"], url_path="apply_to_bu")
    @transaction.atomic
    def apply_to_bu(self, request: Request, pk=None) -> Response:
        """
        Instantiate this RoleTemplate into a target Business Unit.

        This is the primary server-side path for creating a BU role from a
        template blueprint. It:

          1. Validates the template is active and not deleted.
          2. Copies all template permissions atomically into a new CUSTOM Role.
          3. Records ``source_template_id`` on the Role for full auditability.
          4. Returns the fully-serialized created Role.

        Required permissions:
          - Caller must have ``rbac.role.create`` (creating a BU-scoped Role).
          - Super-admins bypass this check.

        Request body:
          - ``business_unit_id`` (required): UUID of the target BU.
          - ``name`` (optional): Override the template name for this BU role.
          - ``description`` (optional): Override the template description.
          - ``is_default`` (optional, bool): Whether this should be the default role for new members.

        Returns: The newly created Role object (RoleSerializer format).
        """
        # Permission check: caller needs rbac.role.create
        if not getattr(request.user, "is_super_admin", False):
            sc = getattr(request, "security_context", None)
            if sc is None or "rbac.role.create" not in sc.permissions:
                raise PermissionDenied(
                    "This action requires the 'rbac.role.create' permission."
                )

        template = RoleTemplate.objects.filter(pk=pk, is_deleted=False, is_active=True).first()
        if not template:
            return Response(
                {"detail": "Template not found, is archived, or is inactive."},
                status=status.HTTP_404_NOT_FOUND,
            )

        business_unit_id = request.data.get("business_unit_id")
        if not business_unit_id:
            return Response(
                {"detail": "'business_unit_id' is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Validate business_unit_id format
        import uuid as _uuid
        try:
            bu_uuid = _uuid.UUID(str(business_unit_id))
        except ValueError:
            return Response(
                {"detail": "'business_unit_id' must be a valid UUID."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Resolve the override fields from request body.
        role_name = request.data.get("name") or template.name
        role_description = request.data.get("description") or template.description
        is_default = bool(request.data.get("is_default", False))
        department_name = request.data.get("department_name")
        module_code = request.data.get("module_code") or template.module_code

        # Check for name collision in this BU (unique_together = BU + name).
        if Role.objects.filter(
            business_unit_id=bu_uuid, name=role_name, is_deleted=False
        ).exists():
            return Response(
                {"detail": f"A role named '{role_name}' already exists in this Business Unit."},
                status=status.HTTP_409_CONFLICT,
            )

        # Create the Role
        role = Role.objects.create(
            business_unit_id=bu_uuid,
            name=role_name,
            description=role_description,
            department_name=department_name,
            role_type=Role.RoleType.CUSTOM,
            module_code=module_code,
            is_default=is_default,
            source_template=template,
            created_by_id=request.user.id,
            updated_by_id=request.user.id,
        )

        # Copy template permissions into RolePermission rows (bulk create for atomicity)
        template_perm_ids = list(
            RoleTemplatePermission.objects.filter(template=template)
            .values_list("permission_id", flat=True)
        )
        if template_perm_ids:
            RolePermission.objects.bulk_create([
                RolePermission(
                    role=role,
                    permission_id=perm_id,
                    created_by_id=request.user.id,
                    updated_by_id=request.user.id,
                )
                for perm_id in template_perm_ids
            ])

        logger.info(
            "Instantiated template '%s' (id=%s) → Role '%s' (id=%s) in BU %s with %d permissions.",
            template.name, template.id, role.name, role.id, bu_uuid, len(template_perm_ids),
        )

        # Return the full Role object
        from apps.iam.api.serializers.role_serializer import RoleSerializer
        role = Role.objects.prefetch_related("permissions").get(id=role.id)
        return CreatedResponse(
            data=RoleSerializer(role, context={"request": request}).data,
            message=(
                f"Role '{role.name}' created from template '{template.name}' "
                f"with {len(template_perm_ids)} permissions."
            ),
        )
