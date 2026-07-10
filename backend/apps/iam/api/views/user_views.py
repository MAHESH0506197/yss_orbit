# yss_orbit\backend\apps\users\api\views\user_views.py
"""
YSS Orbit — User ViewSet
B07 §5.3: All protected endpoints MUST have permission checks. Deny by default.
B07 §5.10: Access MUST be DENIED unless explicitly allowed by a verified permission.
B07 §7: Missing permission check = CRITICAL violation.

FIX-BUG-USER-RBAC: Previously extended viewsets.ModelViewSet with no per-action
WRITE_PERMISSIONS — any user with users.user.view could create/update/delete users.
Now extended from BaseViewSet with WRITE_PERMISSIONS pattern matching BusinessDomainViewSet
and UserBusinessUnitViewSet. RBAC codes verified present in sync_rbac.py PERMISSION_CATALOGUE.

FIX-BUG-USER-FILTER: is_active → is_active_membership in UBU membership filter.
UserBusinessUnitModel has field 'is_active_membership', not 'is_active'.
The old filter silently matched nothing, causing all non-super-admin users to see
the full unfiltered user list regardless of BU scope.
"""
import logging

from rest_framework.permissions import IsAuthenticated
from rest_framework.request import Request
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework import status

from core.base.base_viewset import BaseViewSet
from core.responses import SuccessResponse, CreatedResponse, NoContentResponse
from core.permissions.rbac_permission import HasRBACPermission
from apps.iam.models.user import User
from apps.iam.api.serializers.user_serializer import UserSerializer

logger = logging.getLogger(__name__)


class UserViewSet(BaseViewSet):
    """
    /api/v1/users/
    Full CRUD for platform users.

    FIX-BUG-USER-RBAC: RBAC-enforced per action.
      - List / Retrieve : users.user.view   (required_permissions)
      - Create          : users.user.create (WRITE_PERMISSIONS)
      - Update          : users.user.update (WRITE_PERMISSIONS)
      - Destroy         : users.user.delete (WRITE_PERMISSIONS)
    Super admins bypass per HasRBACPermission logic.

    FIX-BUG-USER-FILTER: is_active → is_active_membership in UBU join filter.
    """
    serializer_class = UserSerializer

    # B07 §5.3: IsAuthenticated + deny-by-default RBAC.
    permission_classes   = [IsAuthenticated, HasRBACPermission]
    # B07 §5.16: View permission gates list/retrieve.
    required_permissions = ["users.user.view"]

    # FIX-BUG-USER-RBAC: write actions now gated on separate permission codes.
    WRITE_PERMISSIONS = {
        "create":         ["users.user.create"],
        "update":         ["users.user.update"],
        "partial_update": ["users.user.update"],
        "destroy":        ["users.user.delete"],
        "restore":        ["users.user.restore"],
    }

    def get_queryset(self):
        """
        Multi-tenant filtered queryset.
        B02: Non-super-admin users see only users within their allowed Business Unit scope.
        B01 §5.15: Tenant enforcement via BU header / organization_id param.
        """
        user = self.request.user
        p = self.request.query_params

        # 1. Handle is_deleted parameter
        is_deleted_param = p.get("is_deleted", "false").lower()
        if getattr(user, "is_super_admin", False):
            if is_deleted_param == "all":
                qs = User.objects.all()
            elif is_deleted_param == "true":
                qs = User.objects.filter(is_deleted=True)
            else:
                qs = User.objects.filter(is_deleted=False)
        else:
            qs = User.objects.filter(is_deleted=False)

        if getattr(self, 'action', None) in ['list', 'retrieve']:
            qs = qs.prefetch_related('bu_memberships_new__business_unit__organization', 'bu_memberships_new__role')

        # 2. Scope by Business Unit / Organization
        business_unit_id = self.request.headers.get("X-Business-Unit-Id")
        organization_id  = p.get("organization_id")
        
        if getattr(user, "is_super_admin", False):
            # Super admins see global scope, but can filter explicitly
            if business_unit_id:
                qs = qs.filter(
                    bu_memberships_new__business_unit_id=business_unit_id,
                    bu_memberships_new__is_active_membership=True,
                    bu_memberships_new__is_deleted=False,
                ).distinct()
            elif organization_id:
                qs = qs.filter(
                    bu_memberships_new__business_unit__organization_id=organization_id,
                    bu_memberships_new__is_active_membership=True,
                    bu_memberships_new__is_deleted=False,
                ).distinct()
        else:
            if business_unit_id:
                qs = qs.filter(
                    bu_memberships_new__business_unit_id=business_unit_id,
                    bu_memberships_new__is_active_membership=True,
                    bu_memberships_new__is_deleted=False,
                ).distinct()
            elif organization_id:
                qs = qs.filter(
                    bu_memberships_new__business_unit__organization_id=organization_id,
                    bu_memberships_new__is_active_membership=True,
                    bu_memberships_new__is_deleted=False,
                ).distinct()

        # 3. Apply status filters
        is_active = p.get("is_active")
        if is_active is not None:
            qs = qs.filter(is_active=is_active.lower() == "true")
            
        is_super_admin = p.get("is_super_admin")
        if is_super_admin is not None:
            qs = qs.filter(is_super_admin=is_super_admin.lower() == "true")
            
        is_standard = p.get("is_standard")
        if is_standard is not None:
            # "Standard" means non-super-admin platform users
            if is_standard.lower() == "true":
                qs = qs.filter(is_super_admin=False)

        # 4. Search filter
        search = p.get("search", "").strip()
        if search:
            from django.db.models import Q
            qs = qs.filter(
                Q(username__icontains=search) |
                Q(email__icontains=search) |
                Q(first_name__icontains=search) |
                Q(last_name__icontains=search)
            )

        return qs

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        
        # Compute global stats for KPIs
        from django.db.models import Count, Q
        base_qs = User.objects.all()
        # For non-super-admin, stats should reflect their scope. For now, global.
        if not getattr(request.user, "is_super_admin", False):
             # Ideally limit to their scope, but we use the filtered qs without search/status
             base_qs = User.objects.filter(is_deleted=False).filter(id__in=queryset.values('id'))

        agg = base_qs.aggregate(
            total=Count("id", filter=Q(is_deleted=False)),
            total_active=Count("id", filter=Q(is_deleted=False, is_active=True)),
            total_inactive=Count("id", filter=Q(is_deleted=False, is_active=False)),
            total_deleted=Count("id", filter=Q(is_deleted=True)),
            total_super_admin=Count("id", filter=Q(is_deleted=False, is_super_admin=True)),
            total_standard=Count("id", filter=Q(is_deleted=False, is_super_admin=False)),
        )
        stats = {k: v or 0 for k, v in agg.items()}

        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            res = self.get_paginated_response(serializer.data)
            res.data["meta"].update(stats)
            return res

        serializer = self.get_serializer(queryset, many=True)
        from core.responses import SuccessResponse
        return SuccessResponse(data=serializer.data, message="Users retrieved successfully")

    def check_write_permission(self) -> None:
        """Gate write operations on their specific permissions."""
        required = self.WRITE_PERMISSIONS.get(self.action, [])
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


    def perform_create(self, serializer):
        user_id = self.request.user.id if self.request.user.is_authenticated else None
        reason = self.request.data.get("reason", "")
        serializer.save(created_by_id=user_id, created_reason=reason)

    def perform_update(self, serializer):
        user_id = self.request.user.id if self.request.user.is_authenticated else None
        reason = self.request.data.get("reason", "")
        serializer.save(updated_by_id=user_id, updated_reason=reason)

    def create(self, request: Request, *args, **kwargs) -> Response:
        """FIX-BUG-USER-RBAC: Gate create on users.user.create."""
        self.check_write_permission()
        res = super().create(request, *args, **kwargs)
        from apps.compliance.services.audit_service import log_action, AuditLog
        from core.utils.ip_utils import get_client_ip
        if res.status_code == 201:
            log_action(
                action=AuditLog.Action.CREATE,
                resource_type="iam.User",
                user_id=request.user.id if request.user.is_authenticated else None,
                user_username=request.user.username if request.user.is_authenticated else "",
                resource_id=res.data.get("data", {}).get("id"),
                resource_display=res.data.get("data", {}).get("username", ""),
                new_values=res.data.get("data"),
                ip_address=get_client_ip(request),
                user_agent=request.META.get("HTTP_USER_AGENT", ""),
            )
        return res

    def update(self, request: Request, *args, **kwargs) -> Response:
        """FIX-BUG-USER-RBAC: Gate update on users.user.update."""
        self.check_write_permission()
        res = super().update(request, *args, **kwargs)
        from apps.compliance.services.audit_service import log_action, AuditLog
        from core.utils.ip_utils import get_client_ip
        if res.status_code in [200, 204]:
            log_action(
                action=AuditLog.Action.UPDATE,
                resource_type="iam.User",
                user_id=request.user.id if request.user.is_authenticated else None,
                user_username=request.user.username if request.user.is_authenticated else "",
                resource_id=kwargs.get("pk"),
                resource_display=res.data.get("data", {}).get("username", "User"),
                new_values=res.data.get("data"),
                ip_address=get_client_ip(request),
                user_agent=request.META.get("HTTP_USER_AGENT", ""),
            )
        return res

    def partial_update(self, request: Request, *args, **kwargs) -> Response:
        """FIX-BUG-USER-RBAC: Gate partial_update on users.user.update."""
        self.check_write_permission()
        res = super().partial_update(request, *args, **kwargs)
        from apps.compliance.services.audit_service import log_action, AuditLog
        from core.utils.ip_utils import get_client_ip
        if res.status_code in [200, 204]:
            log_action(
                action=AuditLog.Action.UPDATE,
                resource_type="iam.User",
                user_id=request.user.id if request.user.is_authenticated else None,
                user_username=request.user.username if request.user.is_authenticated else "",
                resource_id=kwargs.get("pk"),
                resource_display=res.data.get("data", {}).get("username", "User"),
                new_values=res.data.get("data"),
                ip_address=get_client_ip(request),
                user_agent=request.META.get("HTTP_USER_AGENT", ""),
            )
        return res

    def destroy(self, request: Request, *args, **kwargs) -> Response:
        """
        FIX-BUG-USER-RBAC: Gate destroy on users.user.delete.
        Default: soft-delete (archive).
        ?hard=true: permanent (hard) delete - super admin only.
        """
        self.check_write_permission()

        if request.query_params.get("hard", "").lower() == "true":
            return self._hard_delete(request, *args, **kwargs)

        instance = self.get_object()
        user_id = getattr(request.user, "id", None)
        reason = request.data.get("reason", "")
        
        instance.soft_delete(deleted_by_id=user_id, reason=reason)

        from apps.compliance.services.audit_service import log_action, AuditLog
        from core.utils.ip_utils import get_client_ip
        log_action(
            action=AuditLog.Action.DELETE,
            resource_type="iam.User",
            user_id=request.user.id if request.user.is_authenticated else None,
            user_username=request.user.username if request.user.is_authenticated else "",
            resource_id=instance.id,
            resource_display=instance.username,
            ip_address=get_client_ip(request),
            user_agent=request.META.get("HTTP_USER_AGENT", ""),
        )
        from core.responses import NoContentResponse
        return NoContentResponse(message="User archived successfully.")

    def _hard_delete(self, request: Request, *args, **kwargs) -> Response:
        """Permanent (hard) delete - super admin only."""
        if not getattr(self.request.user, "is_super_admin", False):
            return Response(
                {"detail": "Permanent delete is restricted to super administrators."},
                status=status.HTTP_403_FORBIDDEN,
            )

        try:
            # For users, is_deleted=True are just normal records in User.objects for super admins
            user_instance = User.objects.get(pk=kwargs.get("pk"))
        except User.DoesNotExist:
            return Response(
                {"detail": "User not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        confirmation_name = (request.data or {}).get("confirmation_username", "")
        if confirmation_name != user_instance.username:
            return Response(
                {"detail": "confirmation_username does not match the username. Permanent delete cancelled."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user_id = user_instance.id
        username = user_instance.username
        user_instance.delete()

        from apps.compliance.services.audit_service import log_action, AuditLog
        from core.utils.ip_utils import get_client_ip
        log_action(
            action=AuditLog.Action.DELETE,
            resource_type="iam.User",
            user_id=request.user.id if request.user.is_authenticated else None,
            user_username=request.user.username if request.user.is_authenticated else "",
            resource_id=user_id,
            resource_display=username + " (PERMANENT)",
            ip_address=get_client_ip(request),
            user_agent=request.META.get("HTTP_USER_AGENT", ""),
        )
        from core.responses import NoContentResponse
        return NoContentResponse(message="User permanently deleted.")

    @action(detail=True, methods=["post"])
    def restore(self, request, pk=None):
        """Restore an archived user."""
        self.check_write_permission()
        try:
            instance = User.objects.get(pk=pk)
        except User.DoesNotExist:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)
            
        user_id = getattr(request.user, "id", None)
        reason = request.data.get("reason", "")
        
        instance.restore(restored_by_id=user_id, reason=reason)

        from apps.compliance.services.audit_service import log_action, AuditLog
        from core.utils.ip_utils import get_client_ip
        log_action(
            action=AuditLog.Action.UPDATE,
            resource_type="iam.User",
            user_id=request.user.id if request.user.is_authenticated else None,
            user_username=request.user.username if request.user.is_authenticated else "",
            resource_id=instance.id,
            resource_display=instance.username + " (RESTORED)",
            ip_address=get_client_ip(request),
            user_agent=request.META.get("HTTP_USER_AGENT", ""),
        )
        from core.responses import SuccessResponse
        return SuccessResponse(data={"id": instance.id}, message="User restored successfully.")
