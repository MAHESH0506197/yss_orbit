from __future__ import annotations
import logging

from django.db.models import QuerySet, Count, Q
from rest_framework import status
from rest_framework.decorators import action
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response
from drf_spectacular.utils import extend_schema, extend_schema_view, OpenApiParameter

from core.base.base_viewset import BaseViewSet
from core.responses import SuccessResponse, CreatedResponse, NoContentResponse
from core.permissions.rbac_permission import HasRBACPermission
from apps.organization.models import BusinessDomain
from apps.organization.api.serializers.business_domain_serializer import BusinessDomainSerializer
from apps.organization.services.business_domain_service import BusinessDomainService
from apps.platform.core_exceptions import ValidationException

logger = logging.getLogger(__name__)

ALLOWED_ORDERINGS = frozenset({
    "name", "-name", "code", "-code", "created_at", "-created_at", "is_active", "-is_active",
})

# Write permission codes per action
WRITE_PERMISSIONS = {
    "create":         ["business_domain.businessdomain.create"],
    "update":         ["business_domain.businessdomain.update"],
    "partial_update": ["business_domain.businessdomain.update"],
    "destroy":        ["business_domain.businessdomain.delete"],
    "restore":        ["business_domain.businessdomain.restore"],
    "upload_logo":    ["business_domain.businessdomain.update"],
}


@extend_schema_view(
    list=extend_schema(
        summary="List business domains",
        parameters=[
            OpenApiParameter("search",    str,  description="Search by name or code"),
            OpenApiParameter("is_active", bool, description="Filter by active status"),
            OpenApiParameter("status",    str,  description="all|active|inactive|deleted"),
            OpenApiParameter("ordering",  str,  description="name|-name|code|-code|created_at|-created_at"),
            OpenApiParameter("page",      int,  description="Page number"),
            OpenApiParameter("page_size", int,  description="Records per page"),
        ],
    ),
    retrieve=extend_schema(summary="Get single business domain"),
    create=extend_schema(summary="Create business domain (admin only)", request=BusinessDomainSerializer, responses={201: BusinessDomainSerializer}),
    update=extend_schema(summary="Full update business domain (admin only)", responses={200: BusinessDomainSerializer}),
    partial_update=extend_schema(summary="Partial update business domain (admin only)", responses={200: BusinessDomainSerializer}),
    destroy=extend_schema(
        summary="Soft-delete (archive) or permanently delete a business domain",
        description=(
            "Default behaviour: soft-delete (archive).\n\n"
            "Pass `?hard=true` + JSON body `{ \"confirmation_name\": \"<exact domain name>\" }` "
            "to permanently delete (super admin only, domain must already be archived)."
        ),
    ),
)
class BusinessDomainViewSet(BaseViewSet):
    """
    /api/v1/business-domains/
    Platform-level configuration. Represents operational ecosystems
    (e.g. Retail, Pharmacy, Restaurant) that Business Units are classified under.

    FIX-BUG08: HasRBACPermission added. Write operations require elevated permissions.
    Read operations are open to all authenticated users (needed for BU dropdowns).
    """
    permission_classes   = [IsAuthenticated, HasRBACPermission]
    required_permissions = ["business_domain.businessdomain.view"]
    serializer_class     = BusinessDomainSerializer

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.service = BusinessDomainService()

    def get_serializer_class(self):
        if self.action == "list":
            from apps.organization.api.serializers.business_domain_serializer import BusinessDomainListSerializer
            return BusinessDomainListSerializer
        return super().get_serializer_class()

    def check_write_permission(self) -> None:
        required = WRITE_PERMISSIONS.get(self.action, [])
        if not required:
            return
        if getattr(self.request.user, "is_super_admin", False):
            return
        sc = getattr(self.request, "security_context", None)
        if sc is None:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Authentication required.")
        for perm in required:
            if perm not in getattr(sc, "permissions", set()):
                from rest_framework.exceptions import PermissionDenied
                raise PermissionDenied(
                    f"Permission '{perm}' is required for this action."
                )

    def _is_super_admin(self) -> bool:
        return getattr(self.request.user, "is_super_admin", False)

    def get_queryset(self) -> QuerySet:
        p = self.request.query_params
        
        if self.action in ["retrieve", "update", "partial_update", "destroy", "restore", "hard_delete"]:
            # Allow admins to retrieve/update/delete archived domains by ID
            qs = BusinessDomain.all_objects.all() if self._is_super_admin() else BusinessDomain.objects.all()
        else:
            status_filter = p.get("status", "all").lower()
            is_deleted_param = p.get("is_deleted", "false").lower()

            if (self._is_super_admin() and (status_filter == "deleted" or is_deleted_param == "true")):
                qs = BusinessDomain.all_objects.filter(is_deleted=True)
            else:
                qs = BusinessDomain.objects.all()
                if status_filter == "active":
                    qs = qs.filter(is_active=True)
                elif status_filter == "inactive":
                    qs = qs.filter(is_active=False)

        search = p.get("search", "").strip()
        if search:
            qs = qs.filter(
                Q(name__icontains=search) | Q(code__icontains=search) | Q(description__icontains=search)
            )

        is_active = p.get("is_active")
        if is_active is not None:
            qs = qs.filter(is_active=is_active.lower() == "true")

        ordering = p.get("ordering", "name")
        qs = qs.order_by(ordering if ordering in ALLOWED_ORDERINGS else "name")

        return qs.annotate(
            business_units_count=Count(
                "organization_set__business_units",
                filter=Q(organization_set__business_units__is_deleted=False),
                distinct=True,
            ),
            organizations_count=Count(
                "organization_set",
                filter=Q(organization_set__is_deleted=False),
                distinct=True,
            ),
            # PERF-01 FIX: Annotate active_users_count at queryset level.
            # Serializer _get_active_users_count() falls back to 2 extra queries per domain
            # without this annotation — causing N+1 on list endpoints.
            active_users_count=Count(
                "organization_set__business_units__user_memberships_new__user_id",
                filter=Q(
                    organization_set__is_deleted=False,
                    organization_set__business_units__is_deleted=False,
                    organization_set__business_units__user_memberships_new__is_deleted=False,
                    organization_set__business_units__user_memberships_new__is_active_membership=True,
                ),
                distinct=True,
            ),
        )

    def list(self, request: Request, *args, **kwargs) -> Response:
        queryset = self.filter_queryset(self.get_queryset())

        # Domains are platform-level — stats are always global
        base = BusinessDomain.all_objects
        agg  = base.aggregate(
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
        
        domain = self.service.create_domain(
            data=serializer.validated_data,
            created_by_id=getattr(request.user, "id", None)
        )
        domain_with_counts = self.get_queryset().get(pk=domain.pk)
        
        return CreatedResponse(
            data=BusinessDomainSerializer(domain_with_counts, context={"request": request}).data,
            message="Business Domain created successfully.",
        )

    def update(self, request: Request, *args, **kwargs) -> Response:
        self.check_write_permission()
        partial  = kwargs.pop("partial", False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial, context={"request": request})
        serializer.is_valid(raise_exception=True)

        try:
            domain = self.service.update_domain(
                domain_id=instance.id,
                data=serializer.validated_data,
                updated_by_id=getattr(request.user, "id", None)
            )
            domain_with_counts = self.get_queryset().get(pk=domain.pk)
        except ValidationException as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)

        return SuccessResponse(
            data=BusinessDomainSerializer(domain_with_counts, context={"request": request}).data,
            message="Business Domain updated successfully.",
        )

    def destroy(self, request: Request, *args, **kwargs) -> Response:
        """
        Default: soft-delete (archive).
        ?hard=true: permanent (hard) delete — super admin only.
        """
        self.check_write_permission()

        if request.query_params.get("hard", "").lower() == "true":
            return self._hard_delete(request, *args, **kwargs)

        instance = self.get_object()
        user_id = getattr(request.user, "id", None)
        reason = request.data.get("reason", "")
        
        try:
            self.service.soft_delete_domain(
                domain_id=instance.id,
                deleted_by_id=user_id,
                reason=reason
            )
        except ValidationException as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)

        return NoContentResponse(message="Business Domain archived successfully.")

    def _hard_delete(self, request: Request, *args, **kwargs) -> Response:
        """Permanent (hard) delete — super admin only."""
        if not self._is_super_admin():
            return Response(
                {"detail": "Permanent delete is restricted to super administrators."},
                status=status.HTTP_403_FORBIDDEN,
            )

        try:
            domain = BusinessDomain.all_objects.get(pk=kwargs.get("pk"))
        except BusinessDomain.DoesNotExist:
            # S-05 FIX: Return 404 — domain doesn't exist. Previously returned 204 ("deleted"),
            # which misled callers into thinking the operation succeeded on a non-existent record.
            return Response(
                {"detail": "Business Domain not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        confirmation_name = (request.data or {}).get("confirmation_name", "")
        if confirmation_name != domain.name:
            return Response(
                {"detail": "confirmation_name does not match the domain name. Permanent delete cancelled."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            self.service.hard_delete_domain(
                domain_id=domain.id,
                deleted_by_id=getattr(request.user, "id", None)
            )
        except ValidationException as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)

        return NoContentResponse(message=f"Business Domain '{domain.name}' permanently deleted.")

    @extend_schema(summary="Restore a soft-deleted business domain", responses={200: BusinessDomainSerializer})
    @action(detail=True, methods=["post"], url_path="restore")
    def restore(self, request: Request, *args, **kwargs) -> Response:
        self.check_write_permission()
        reason = request.data.get("reason", "")
        
        try:
            domain = self.service.restore_domain(
                domain_id=kwargs.get("pk"),
                restored_by_id=getattr(request.user, "id", None),
                reason=reason
            )
            domain_with_counts = self.get_queryset().get(pk=domain.pk)
        except ValidationException as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception:
            return Response({"detail": "Business Domain not found or not archived."}, status=status.HTTP_404_NOT_FOUND)

        return SuccessResponse(
            data=BusinessDomainSerializer(domain_with_counts, context={"request": request}).data,
            message="Business Domain restored successfully.",
        )

    @extend_schema(summary="Upload a business domain logo", description="Multipart: 'logo'. JPEG/PNG/WebP/GIF. Max 5 MB.")
    @action(detail=True, methods=["post"], url_path="upload-logo", parser_classes=[MultiPartParser, FormParser])
    def upload_logo(self, request: Request, *args, **kwargs) -> Response:
        self.check_write_permission()
        domain = self.get_object()
        
        logo_file = request.FILES.get("logo")
        try:
            logo_url = self.service.upload_logo(
                domain_id=domain.id,
                logo_file=logo_file,
                updated_by_id=getattr(request.user, "id", None)
            )
        except ValidationException as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)

        return SuccessResponse(data={"logo_url": logo_url}, message="Logo uploaded successfully.")
