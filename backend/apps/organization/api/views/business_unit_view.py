# apps/organization/api/views/business_unit_view.py
"""
YSS Orbit — Business Unit ViewSet

ENTERPRISE AUDIT FIXES:
  ✅ SEC-01/02/03: WRITE_PERMISSIONS dict + check_write_permission() added — destroy/update now
     require explicit 'business_unit.businessunit.delete' / 'business_unit.businessunit.update'.
  ✅ DEFECT-09: business_domain_id filter routed through organization FK
     (qs.filter(organization__business_domain_id=...)) — direct field does not exist on BU model.
  ✅ FIX-BUG05: Stats aggregate scoped to org context — no cross-tenant leak.
  ✅ FIX-BUG09: HasRBACPermission added (previously only IsAuthenticated).
  ✅ FIX-BUG08(meta): industry removed from meta endpoint — now returns business_domains.
  ✅ C-01/C-02: destroy() now reads reason from request.data and passes it to service.
  ✅ M-03: Non-super-admin users can now filter archived BUs within their own org.
  ✅ H-06: ALLOWED_ORDERINGS now includes is_active/-is_active.
  ✅ H-04: total_main_branches added to list stats aggregate.
  ✅ M-07: users_count/roles_count annotated on queryset to eliminate N+1.
"""
from __future__ import annotations
import logging
import uuid

from django.db.models import QuerySet, Count, Q, Prefetch
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
from apps.organization.models import BusinessUnit
from apps.organization.constants.constants import (
    ALLOWED_ORDERINGS, GST_REGEX_PATTERN, PAN_REGEX_PATTERN, HEX_REGEX_PATTERN, CODE_REGEX_PATTERN
)
from apps.organization.api.serializers.business_unit_serializer import (
    BusinessUnitSerializer,
    BusinessUnitListSerializer,
    BusinessUnitCreateUpdateSerializer,
)
from apps.organization.services.business_unit_service import BusinessUnitService
from apps.platform.models.brand_configuration import BrandConfiguration
from core.utils.media_utils import save_logo_file

logger = logging.getLogger(__name__)


@extend_schema_view(
    list=extend_schema(
        summary="List business units",
        parameters=[
            OpenApiParameter("search",             str,  description="Search by name, code, or city"),
            OpenApiParameter("organization_id",    str,  description="Filter by org UUID (super-admin only)"),
            OpenApiParameter("business_domain_id", str,  description="Filter by business domain UUID"),
            OpenApiParameter("is_active",          bool, description="Filter by active status"),
            OpenApiParameter("is_deleted",         bool, description="Include archived (super-admin only)"),
            OpenApiParameter("is_main_branch",     bool, description="Filter only main branches"),
            OpenApiParameter("ordering",           str,  description="name|-name|code|-code|created_at|-created_at"),
            OpenApiParameter("page",               int,  description="Page number"),
            OpenApiParameter("page_size",          int,  description="Records per page (max 100)"),
        ],
    ),
    retrieve=extend_schema(summary="Get single business unit"),
    create=extend_schema(summary="Create business unit", request=BusinessUnitCreateUpdateSerializer, responses={201: BusinessUnitSerializer}),
    update=extend_schema(summary="Full update business unit", request=BusinessUnitCreateUpdateSerializer, responses={200: BusinessUnitSerializer}),
    partial_update=extend_schema(summary="Partial update business unit", request=BusinessUnitCreateUpdateSerializer, responses={200: BusinessUnitSerializer}),
    destroy=extend_schema(summary="Soft-delete (archive) business unit"),
)
class BusinessUnitViewSet(BaseViewSet):
    """
    /api/v1/business-units/
    Full CRUD + restore + logo upload.

    SEC-03 FIX: WRITE_PERMISSIONS now gates all state-changing actions.
    DEFECT-09 FIX: business_domain_id filter routes through org FK.
    """
    permission_classes   = [IsAuthenticated, HasRBACPermission]
    required_permissions = ["business_unit.businessunit.view"]

    def __init__(self, **kwargs):
        # S-03 FIX: service initialized per-instance, not as class-level singleton.
        # Class-level singletons are a thread-safety risk if service ever holds request state.
        super().__init__(**kwargs)
        self.service = BusinessUnitService()

    # ─── RBAC write guards ────────────────────────────────────────────────────
    WRITE_PERMISSIONS = {
        "create":         ["business_unit.businessunit.create"],
        "update":         ["business_unit.businessunit.update"],
        "partial_update": ["business_unit.businessunit.update"],
        "destroy":        ["business_unit.businessunit.delete"],
        "restore":        ["business_unit.businessunit.restore"],
        "upload_logo":    ["business_unit.businessunit.update"],
    }

    def check_write_permission(self) -> None:
        """Gate state-changing actions on top of the base 'view' permission."""
        required = self.WRITE_PERMISSIONS.get(self.action, [])
        if not required:
            return
        if getattr(self.request.user, "is_super_admin", False):
            return
        sc = getattr(self.request, "security_context", None)
        if sc is None:
            raise PermissionDenied("No security context. Ensure you are authenticated.")
        for perm in required:
            if perm not in sc.permissions:
                raise PermissionDenied(
                    f"You do not have the '{perm}' permission required for this action."
                )

    def get_serializer_class(self):
        if self.action in ("create", "update", "partial_update"):
            return BusinessUnitCreateUpdateSerializer
        if self.action == "list":
            return BusinessUnitListSerializer
        return BusinessUnitSerializer

    def get_serializer_context(self):
        ctx = super().get_serializer_context()
        ctx["org_id"] = self._get_org_id()
        return ctx

    def _is_super_admin(self) -> bool:
        return getattr(self.request.user, "is_super_admin", False)

    def _get_org_id(self) -> uuid.UUID | None:
        if self._is_super_admin():
            org_id_param = self.request.query_params.get("organization_id")
            if org_id_param:
                try:
                    return uuid.UUID(org_id_param)
                except (ValueError, AttributeError):
                    pass
            return None
        return getattr(self.request.user, "organization_id", None)

    def get_queryset(self) -> QuerySet:
        # A-06 FIX: BrandConfiguration imported at top-level, not here per-request.
        p = self.request.query_params
        is_deleted_str = p.get("is_deleted", "false").lower()
        include_deleted = is_deleted_str == "true"

        if self._is_super_admin():
            qs = (BusinessUnit.all_objects.filter(is_deleted=True)
                  if include_deleted
                  else BusinessUnit.objects.filter(is_deleted=False))
            org_id_param = p.get("organization_id")
            if org_id_param:
                qs = qs.filter(organization_id=org_id_param)
        else:
            org_id = getattr(self.request.user, "organization_id", None)
            if not org_id:
                return BusinessUnit.objects.none()
            # M-03 FIX: Regular users can now also view archived BUs within their org
            # when is_deleted=true is explicitly requested (enables the "Archived" tab).
            if include_deleted:
                qs = BusinessUnit.all_objects.filter(organization_id=org_id, is_deleted=True)
            else:
                qs = BusinessUnit.objects.filter(organization_id=org_id, is_deleted=False)

        search = p.get("search", "").strip()
        if search:
            qs = qs.filter(
                Q(name__icontains=search) | Q(code__icontains=search)
                | Q(city__icontains=search) | Q(email__icontains=search)
            )

        # DEFECT-09 FIX: BusinessUnit has no direct business_domain_id column —
        # it is a @property computed from organization.business_domain.
        # Filter through the organization FK instead.
        business_domain_id = p.get("business_domain_id")
        if business_domain_id:
            qs = qs.filter(organization__business_domain_id=business_domain_id)

        is_active = p.get("is_active")
        if is_active is not None:
            qs = qs.filter(is_active=is_active.lower() == "true")

        is_main = p.get("is_main_branch")
        if is_main is not None:
            qs = qs.filter(is_main_branch=is_main.lower() == "true")

        ordering = p.get("ordering", "name")
        qs = qs.order_by(ordering if ordering in ALLOWED_ORDERINGS else "name")

        if self.action in ("list", "retrieve"):
            qs = qs.select_related("organization", "organization__business_domain")
            qs = qs.prefetch_related(
                Prefetch(
                    "brand_configurations",
                    queryset=BrandConfiguration.objects.filter(is_deleted=False),
                )
            )

            # M-07 FIX: Annotate counts at queryset level to avoid N+1 queries.
            try:
                from django.db.models import OuterRef, Subquery, IntegerField
                from apps.iam.models.rbac_models import Role as IamRole
                roles_subquery = (
                    IamRole.objects
                    .filter(business_unit_id=OuterRef("id"), is_deleted=False)
                    .values("business_unit_id")
                    .annotate(cnt=Count("id"))
                    .values("cnt")
                )
                qs = qs.annotate(
                    users_count_annotated=Count(
                        "user_memberships_new__user_id",
                        filter=Q(
                            user_memberships_new__is_deleted=False,
                            user_memberships_new__is_active_membership=True,
                        ),
                        distinct=True,
                    ),
                    roles_count_annotated=Subquery(
                        roles_subquery[:1], output_field=IntegerField()
                    ),
                )
            except Exception:
                pass
        else:
            qs = qs.select_related("organization")

        return qs

    def list(self, request: Request, *args, **kwargs) -> Response:
        queryset = self.filter_queryset(self.get_queryset())

        # FIX-BUG05: Stats scoped to org context — no cross-tenant leak.
        if self._is_super_admin():
            base_qs = BusinessUnit.all_objects
            org_id_param = request.query_params.get("organization_id")
            if org_id_param:
                base_qs = base_qs.filter(organization_id=org_id_param)
        else:
            org_id = getattr(request.user, "organization_id", None)
            base_qs = BusinessUnit.all_objects.filter(organization_id=org_id) if org_id else BusinessUnit.objects.none()

        agg = base_qs.aggregate(
            total=Count("id",              filter=Q(is_deleted=False)),
            total_active=Count("id",       filter=Q(is_deleted=False, is_active=True)),
            total_inactive=Count("id",     filter=Q(is_deleted=False, is_active=False)),
            total_deleted=Count("id",      filter=Q(is_deleted=True)),
            # H-04 FIX: Count total main branches across all pages, not just current page.
            total_main_branches=Count("id", filter=Q(is_deleted=False, is_main_branch=True)),
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
        org_id = getattr(request.user, "organization_id", None)
        if self._is_super_admin():
            org_id_body = request.data.get("organization_id")
            if org_id_body:
                try:
                    org_id = uuid.UUID(str(org_id_body))
                except (ValueError, AttributeError):
                    pass
        if not org_id:
            return Response({"detail": "No organization associated with this user."}, status=status.HTTP_400_BAD_REQUEST)

        serializer = self.get_serializer(
            data=request.data,
            context={**self.get_serializer_context(), "org_id": org_id},
        )
        serializer.is_valid(raise_exception=True)

        from apps.organization.models import Organization
        try:
            org = Organization.objects.get(id=org_id, is_deleted=False)
        except Organization.DoesNotExist:
            return Response({"detail": "Organization not found."}, status=status.HTTP_404_NOT_FOUND)

        data = {**serializer.validated_data, "organization": org}
        bu = self.service.create_business_unit(
            security_context=getattr(request, "security_context", None),
            data=data,
        )
        return CreatedResponse(
            data=BusinessUnitSerializer(bu, context={"request": request}).data,
            message="Business Unit created successfully.",
        )

    def update(self, request: Request, *args, **kwargs) -> Response:
        self.check_write_permission()
        partial  = kwargs.pop("partial", False)
        instance = self.get_object()
        serializer = self.get_serializer(
            instance, data=request.data, partial=partial,
            context=self.get_serializer_context(),
        )
        serializer.is_valid(raise_exception=True)
        bu = self.service.update_business_unit(
            security_context=getattr(request, "security_context", None),
            bu_id=instance.id,
            data=serializer.validated_data,
            org_id=instance.organization_id,
        )
        return SuccessResponse(
            data=BusinessUnitSerializer(bu, context={"request": request}).data,
            message="Business Unit updated successfully.",
        )

    def destroy(self, request: Request, *args, **kwargs) -> Response:
        self.check_write_permission()
        instance = self.get_object()

        # C-03 FIX: Support permanent (hard) delete via ?permanent=true.
        # This is required for the "Delete Forever" button in the UI.
        # Permanent delete requires a stronger permission than soft-delete.
        is_permanent = request.query_params.get("permanent", "").lower() == "true"
        if is_permanent:
            # Require a dedicated permanent_delete permission (stronger than delete)
            from core.permissions.rbac_permission import HasRBACPermission
            perm_checker = HasRBACPermission()
            perm_checker.permission_codename = "business_unit.permanent_delete"
            if not perm_checker.has_permission(request, self):
                return Response(
                    {"detail": "You do not have permission to permanently delete business units."},
                    status=status.HTTP_403_FORBIDDEN,
                )
            # Only archived (soft-deleted) BUs can be permanently deleted
            if not instance.is_deleted:
                return Response(
                    {"detail": "Only archived business units can be permanently deleted. Archive it first."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            bu_name = instance.name
            bu_id = instance.id
            instance.delete()  # Hard (permanent) delete — bypasses soft-delete
            logger.info(
                "BusinessUnit permanently deleted: %s (id=%s) by user %s",
                bu_name, bu_id, getattr(request.user, "id", "?"),
            )
            return NoContentResponse(message="Business Unit permanently deleted.")

        # Standard path: soft-delete with optional reason
        # C-01/C-02 FIX: Read reason from request body and pass it to the service.
        # Previously the reason was silently dropped and overwritten with "" in the service.
        reason = request.data.get("reason", "") if isinstance(request.data, dict) else ""
        self.service.delete_business_unit(
            security_context=getattr(request, "security_context", None),
            bu_id=instance.id,
            org_id=instance.organization_id,
            reason=reason,
        )
        return NoContentResponse(message="Business Unit archived successfully.")


    @extend_schema(summary="Restore a soft-deleted business unit", responses={200: BusinessUnitSerializer})
    @action(detail=True, methods=["post"], url_path="restore")
    def restore(self, request: Request, *args, **kwargs) -> Response:
        self.check_write_permission()
        # M-06 FIX: Use self.kwargs.get("pk") — DRF router injects pk into
        # the viewset's self.kwargs dict, not the action method's **kwargs.
        pk = self.kwargs.get("pk")
        try:
            bu = BusinessUnit.all_objects.get(pk=pk, is_deleted=True)
        except (BusinessUnit.DoesNotExist, Exception):
            return Response({"detail": "Business Unit not found or not archived."}, status=status.HTTP_404_NOT_FOUND)

        if not self._is_super_admin():
            org_id = getattr(request.user, "organization_id", None)
            if str(bu.organization_id) != str(org_id):
                return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)
        restored = self.service.restore_business_unit(
            security_context=getattr(request, "security_context", None),
            bu_id=bu.id,
        )
        return SuccessResponse(
            data=BusinessUnitSerializer(restored, context={"request": request}).data,
            message="Business Unit restored successfully.",
        )

    @extend_schema(summary="Get business unit validation rules and choice metadata")
    @action(detail=False, methods=["get"], url_path="meta")
    def meta(self, request: Request, *args, **kwargs) -> Response:
        from apps.organization.models import BusinessDomain
        # FIX-BUG08: Removed industries list — field deleted.
        # Returns business_domains from BusinessDomain model (real data, not hardcoded).
        domains = list(
            BusinessDomain.objects
            .filter(is_active=True, is_deleted=False)
            .only("id", "name", "code", "logo_url")
            .order_by("name")
            .values("id", "name", "code", "logo_url")
        )
        return SuccessResponse(data={
            "business_domains": domains,
            "validation": {
                "code_pattern": CODE_REGEX_PATTERN,
                "gst_pattern":  GST_REGEX_PATTERN,
                "pan_pattern":  PAN_REGEX_PATTERN,
                "hex_pattern":  HEX_REGEX_PATTERN,
            },
        })

    @extend_schema(summary="Upload a business unit logo", description="Multipart: 'logo'. JPEG/PNG/WebP/GIF. Max 5 MB.")
    @action(detail=True, methods=["post"], url_path="upload-logo", parser_classes=[MultiPartParser, FormParser])
    def upload_logo(self, request: Request, *args, **kwargs) -> Response:
        """
        A-01 FIX: Uses shared core.utils.media_utils.save_logo_file() instead of
        copy-pasted logo upload logic (was duplicated verbatim in 3 places).
        """
        self.check_write_permission()
        bu = self.get_object()
        logo_file = request.FILES.get("logo")
        user_id = getattr(request.user, "id", None)
        try:
            logo_url = save_logo_file(
                file=logo_file,
                entity_type="bu_logos",
                entity_id=str(bu.id),
                old_logo_url=bu.logo_url,
            )
        except ValueError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)

        bu.logo_url      = logo_url
        bu.updated_by_id = user_id
        bu.save(update_fields=["logo_url", "updated_at", "updated_by_id"])
        logger.info("Logo uploaded for BU %s → %s", bu.id, logo_url)
        return SuccessResponse(data={"logo_url": logo_url}, message="Logo uploaded successfully.")
