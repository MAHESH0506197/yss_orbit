# apps/organization/api/views/organization_view.py
"""
YSS Orbit — OrganizationViewSet

ENTERPRISE AUDIT REBUILD:
  ✅ RBAC write permissions via WRITE_PERMISSIONS dict + check_write_permission()
  ✅ Hard delete (?hard=true) with confirmation_name guard + logo cleanup (Q2)
  ✅ get_queryset uses all_objects for super_admin on retrieve/update/destroy
  ✅ status query param filter (all/active/inactive/deleted)
  ✅ OrganizationSettings import fixed (was NameError in settings action)
  ✅ write guards on restore(), upload_logo(), settings PUT/PATCH
  ✅ restored_at / restored_by_id set on restore()
  ✅ removed slug from search filter (slug removed from model)
  ✅ Stats correctly scoped (FIX-BUG04)
"""
from __future__ import annotations
import logging
import os
import uuid

from django.db.models import QuerySet, Count, Q
from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response
from drf_spectacular.utils import extend_schema, extend_schema_view, OpenApiParameter

from core.base.base_viewset import BaseViewSet
from core.responses import SuccessResponse, CreatedResponse, NoContentResponse
from core.permissions.rbac_permission import HasRBACPermission
from apps.organization.models import Organization, OrganizationSettings
from apps.organization.api.serializers.organization_serializer import (
    OrganizationSerializer,
    OrganizationListSerializer,
    OrganizationCreateUpdateSerializer,
    OrganizationSettingsSerializer,
)
from apps.organization.organizations_service import OrganizationService
from apps.organization.models.user_business_unit_model import UserBusinessUnitModel
from apps.organization.constants.constants import CODE_REGEX_PATTERN, GST_REGEX_PATTERN, PAN_REGEX_PATTERN, HEX_REGEX_PATTERN
from core.utils.media_utils import save_logo_file

logger = logging.getLogger(__name__)

ALLOWED_ORDERINGS = frozenset({
    "name", "-name", "created_at", "-created_at", "is_active", "-is_active",
})

# RBAC permission codes per action (mirrors BusinessDomainViewSet pattern)
WRITE_PERMISSIONS = {
    "create":         ["organization.organization.create"],
    "update":         ["organization.organization.update"],
    "partial_update": ["organization.organization.update"],
    "destroy":        ["organization.organization.delete"],
    "restore":        ["organization.organization.restore"],
    "upload_logo":    ["organization.organization.update"],
    "organization_settings_write": ["organization.organization.update"],
}


@extend_schema_view(
    list=extend_schema(
        summary="List organizations",
        parameters=[
            OpenApiParameter("search",            str,  description="Search by name or email"),
            OpenApiParameter("is_active",         bool, description="Filter by active status"),
            OpenApiParameter("status",            str,  description="all|active|inactive|deleted"),
            OpenApiParameter("business_domain_id",str,  description="Filter by business domain UUID"),
            OpenApiParameter("ordering",          str,  description="name|-name|created_at|-created_at"),
            OpenApiParameter("page",              int,  description="Page number"),
            OpenApiParameter("page_size",         int,  description="Records per page (max 100)"),
        ],
    ),
    retrieve=extend_schema(summary="Get single organization"),
    create=extend_schema(
        summary="Create organization",
        request=OrganizationCreateUpdateSerializer,
        responses={201: OrganizationSerializer},
    ),
    update=extend_schema(
        summary="Full update organization",
        request=OrganizationCreateUpdateSerializer,
        responses={200: OrganizationSerializer},
    ),
    partial_update=extend_schema(
        summary="Partial update organization",
        request=OrganizationCreateUpdateSerializer,
        responses={200: OrganizationSerializer},
    ),
    destroy=extend_schema(
        summary="Soft-delete (archive) or permanently delete an organization",
        description=(
            "Default behaviour: soft-delete (archive).\n\n"
            "Pass `?hard=true` + JSON body `{ \"confirmation_name\": \"<exact org name>\" }` "
            "to permanently delete (super admin only, organization must already be archived)."
        ),
    ),
)
class OrganizationViewSet(BaseViewSet):
    """
    /api/v1/organizations/
    Full CRUD + restore + permanent delete + settings + logo upload.

    Security:
      - All reads: IsAuthenticated + HasRBACPermission (organization.organization.view)
      - All writes: additionally checked by check_write_permission()
      - Hard delete: super-admin only, org must be archived, requires confirmation_name
    """
    permission_classes   = [IsAuthenticated, HasRBACPermission]
    required_permissions = ["organization.organization.view"]

    def __init__(self, **kwargs):
        # S-02 FIX: service initialized per-instance, not as class-level singleton.
        # Class-level singletons are a thread-safety risk if service ever holds request state.
        super().__init__(**kwargs)
        self.service = OrganizationService()

    def get_serializer_class(self):
        if self.action in ("create", "update", "partial_update"):
            return OrganizationCreateUpdateSerializer
        if self.action == "list":
            return OrganizationListSerializer
        return OrganizationSerializer

    # ─── Permission Helpers ────────────────────────────────────────────────────

    def _is_super_admin(self) -> bool:
        return getattr(self.request.user, "is_super_admin", False)

    def check_write_permission(self, action_key: str | None = None) -> None:
        """Gate write operations by RBAC permission code. Super-admins bypass."""
        key = action_key or self.action
        required = WRITE_PERMISSIONS.get(key, [])
        if not required:
            return
        if self._is_super_admin():
            return
        sc = getattr(self.request, "security_context", None)
        if sc is None:
            raise PermissionDenied("Authentication required.")
        for perm in required:
            if perm not in getattr(sc, "permissions", set()):
                raise PermissionDenied(f"Permission '{perm}' is required for this action.")

    # ─── Queryset ─────────────────────────────────────────────────────────────

    def _get_user_org_ids(self):
        """Returns QS of org IDs accessible to the current user via active UBU memberships."""
        return (
            UserBusinessUnitModel.objects
            .filter(
                user_id=self.request.user.id,
                is_active=True,
                is_deleted=False,
                is_active_membership=True,
            )
            .values_list("business_unit__organization_id", flat=True)
            .distinct()
        )

    def get_queryset(self) -> QuerySet:
        p = self.request.query_params

        # For detail/write actions, super_admin can see all including archived
        if self.action in ("retrieve", "update", "partial_update", "destroy", "restore"):
            if self._is_super_admin():
                qs = Organization.all_objects.all()
            else:
                user_org_ids = self._get_user_org_ids()
                qs = Organization.objects.filter(id__in=user_org_ids)
        else:
            # List action — support status filter
            status_filter = p.get("status", "all").lower()
            is_deleted_param = p.get("is_deleted", "false").lower()

            if self._is_super_admin():
                if status_filter == "deleted" or is_deleted_param == "true":
                    qs = Organization.all_objects.filter(is_deleted=True)
                elif status_filter == "active":
                    qs = Organization.all_objects.filter(is_deleted=False, is_active=True)
                elif status_filter == "inactive":
                    qs = Organization.all_objects.filter(is_deleted=False, is_active=False)
                else:
                    qs = Organization.all_objects.filter(is_deleted=False)
            else:
                user_org_ids = self._get_user_org_ids()
                qs = Organization.objects.filter(id__in=user_org_ids)
                if status_filter == "active":
                    qs = qs.filter(is_active=True)
                elif status_filter == "inactive":
                    qs = qs.filter(is_active=False)

        # ── Common filters ────────────────────────────────────────────────────
        search = p.get("search", "").strip()
        if search:
            qs = qs.filter(
                Q(name__icontains=search) | Q(email__icontains=search)
            )

        is_active = p.get("is_active")
        if is_active is not None:
            qs = qs.filter(is_active=is_active.lower() == "true")

        business_domain_id = p.get("business_domain_id")
        if business_domain_id:
            qs = qs.filter(business_domain_id=business_domain_id)

        ordering = p.get("ordering", "name")
        qs = qs.order_by(ordering if ordering in ALLOWED_ORDERINGS else "name")

        return qs.annotate(
            business_units_count=Count(
                "business_units",
                filter=Q(business_units__is_deleted=False),
                distinct=True,
            )
        )

    # ─── Standard CRUD ────────────────────────────────────────────────────────

    def list(self, request: Request, *args, **kwargs) -> Response:
        queryset = self.filter_queryset(self.get_queryset())

        # FIX-BUG04: Stats scoped to user's accessible orgs (not global for non-admins)
        if self._is_super_admin():
            stats_base = Organization.all_objects
        else:
            user_org_ids = self._get_user_org_ids()
            stats_base = Organization.objects.filter(id__in=user_org_ids)

        agg = stats_base.aggregate(
            total=Count("id",          filter=Q(is_deleted=False)),
            total_active=Count("id",   filter=Q(is_deleted=False, is_active=True)),
            total_inactive=Count("id", filter=Q(is_deleted=False, is_active=False)),
            total_deleted=Count("id",  filter=Q(is_deleted=True)),
        )
        stats = {k: v or 0 for k, v in agg.items()}

        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            paginated  = self.get_paginated_response(serializer.data)
            meta       = paginated.data.get("meta", {})
            meta.update(stats)
            paginated.data["meta"] = meta
            return paginated

        serializer = self.get_serializer(queryset, many=True)
        return SuccessResponse(data=serializer.data, meta=stats)

    def create(self, request: Request, *args, **kwargs) -> Response:
        self.check_write_permission()
        serializer = self.get_serializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        org = self.service.create_organization(
            data=serializer.validated_data,
            created_by_id=getattr(request.user, "id", None),
        )
        # FIX C-API-05: Use all_objects to avoid 500 for non-super-admins
        # (new org has no UBU membership yet, so get_queryset() would exclude it)
        org_with_counts = Organization.all_objects.select_related("business_domain").get(pk=org.pk)
        return CreatedResponse(
            data=OrganizationSerializer(org_with_counts, context={"request": request}).data,
            message="Organization created successfully.",
        )

    def update(self, request: Request, *args, **kwargs) -> Response:
        self.check_write_permission()
        partial  = kwargs.pop("partial", False)
        instance = self.get_object()
        serializer = self.get_serializer(
            instance, data=request.data, partial=partial, context={"request": request}
        )
        serializer.is_valid(raise_exception=True)
        org = self.service.update_organization(
            org_id=instance.id,
            data=serializer.validated_data,
            updated_by_id=getattr(request.user, "id", None),
        )
        # ISSUE-09 FIX: Removed dead second org fetch — org_with_counts is what the
        # serializer needs (with Count annotations from get_queryset). The line
        # `org = Organization.all_objects...get(id=org.id)` was never used.
        org_with_counts = self.get_queryset().get(pk=org.pk)
        return SuccessResponse(
            data=OrganizationSerializer(org_with_counts, context={"request": request}).data,
            message="Organization updated successfully.",
        )

    def destroy(self, request: Request, *args, **kwargs) -> Response:
        self.check_write_permission()
        instance = self.get_object()

        # ── Hard delete path ──────────────────────────────────────────────────
        if request.query_params.get("hard", "").lower() == "true":
            if not self._is_super_admin():
                raise PermissionDenied("Permanent deletion requires super-admin privileges.")
            if not instance.is_deleted:
                return Response(
                    {"detail": "Organization must be archived before permanent deletion."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            confirmation_name = (request.data or {}).get("confirmation_name", "")
            if confirmation_name != instance.name:
                return Response(
                    {"detail": "confirmation_name does not match the organization name."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            self.service.permanently_delete_organization(
                org_id=instance.id,
                org_name=instance.name,
                logo_url=instance.logo_url,
            )
            return NoContentResponse(message="Organization permanently deleted.")

        # ── Soft-delete path ──────────────────────────────────────────────────
        reason = request.data.get("reason", "") if isinstance(request.data, dict) else ""
        self.service.delete_organization(
            org_id=instance.id,
            deleted_by_id=getattr(request.user, "id", None),
            reason=reason,
        )
        return NoContentResponse(message="Organization archived successfully.")

    # ─── Custom Actions ────────────────────────────────────────────────────────

    @extend_schema(summary="Restore a soft-deleted organization", responses={200: OrganizationSerializer})
    @action(detail=True, methods=["post"], url_path="restore")
    def restore(self, request: Request, *args, **kwargs) -> Response:
        self.check_write_permission()
        try:
            org = Organization.all_objects.get(pk=kwargs.get("pk"), is_deleted=True)
        except Organization.DoesNotExist:
            return Response(
                {"detail": "Organization not found or not archived."},
                status=status.HTTP_404_NOT_FOUND,
            )
        reason = request.data.get("reason", "") if isinstance(request.data, dict) else ""
        org = self.service.restore_organization(
            org_id=org.id,
            restored_by_id=getattr(request.user, "id", None),
            reason=reason,
        )
        org_with_counts = self.get_queryset().get(pk=org.pk)
        return SuccessResponse(
            data=OrganizationSerializer(org_with_counts, context={"request": request}).data,
            message="Organization restored successfully.",
        )

    @extend_schema(
        summary="Get or update organization settings",
        request=OrganizationSettingsSerializer,
        responses={200: OrganizationSettingsSerializer},
    )
    @action(detail=True, methods=["get", "put", "patch"], url_path="settings")
    def organization_settings(self, request: Request, *args, **kwargs) -> Response:
        org = self.get_object()
        settings_obj, _ = OrganizationSettings.objects.get_or_create(organization=org)

        if request.method == "GET":
            return SuccessResponse(data=OrganizationSettingsSerializer(settings_obj).data)

        # Write methods require permission
        self.check_write_permission("organization_settings_write")
        partial    = request.method == "PATCH"
        serializer = OrganizationSettingsSerializer(
            settings_obj,
            data=request.data,
            partial=partial,
            context={"request": request},
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return SuccessResponse(data=serializer.data, message="Settings updated successfully.")

    @extend_schema(summary="Get organization validation rules and choice metadata")
    @action(detail=False, methods=["get"], url_path="meta")
    def meta(self, request: Request, *args, **kwargs) -> Response:
        """Returns field validation patterns. Slug removed from model — returns actual BU/org constraints."""
        return SuccessResponse(data={
            "validation": {
                "name_max_length": 150,
                "code_regex":      CODE_REGEX_PATTERN,
                "gst_regex":       GST_REGEX_PATTERN,
                "pan_regex":       PAN_REGEX_PATTERN,
                "hex_regex":       HEX_REGEX_PATTERN,
            }
        })

    @extend_schema(
        summary="Upload an organization logo",
        description="Multipart field: 'logo'. Accepted: JPEG, PNG, WebP, GIF. Max 5 MB.",
    )
    @action(
        detail=True, methods=["post"], url_path="upload-logo",
        parser_classes=[MultiPartParser, FormParser],
    )
    def upload_logo(self, request: Request, *args, **kwargs) -> Response:
        """
        A-01 FIX: Uses shared core.utils.media_utils.save_logo_file() instead of
        copy-pasted logo upload logic (was duplicated verbatim in 3 places).
        S-04 FIX: Records updated_by_id in the audit trail (was missing).
        """
        self.check_write_permission()
        org = self.get_object()
        logo_file = request.FILES.get("logo")
        user_id = getattr(request.user, "id", None)
        try:
            logo_url = save_logo_file(
                file=logo_file,
                entity_type="org_logos",
                entity_id=str(org.id),
                old_logo_url=org.logo_url,
            )
        except ValueError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)

        # S-04 FIX: Record updated_by_id so audit trail is complete.
        org.logo_url      = logo_url
        org.updated_by_id = user_id
        org.save(update_fields=["logo_url", "updated_by_id", "updated_at"])
        logger.info("Logo uploaded for org %s by user %s → %s", org.id, user_id, logo_url)
        return SuccessResponse(data={"logo_url": logo_url}, message="Logo uploaded successfully.")
