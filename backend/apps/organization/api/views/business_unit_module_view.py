# yss_orbit\backend\apps\business_unit\api\views\business_unit_module_view.py
"""
YSS Orbit — Business Unit Module Subscription & Access Management
(IMPLEMENTATION_PLAN.md items 3 & 4)

This is the API the previously-EMPTY apps.organization.management.commands.
sync_business_unit and apps.tenancy (BUG-38, superseded) should have
been. BusinessUnitModule is read by ModuleSubscriptionMiddleware
(apps.platform.catalogue.middleware) for the 14 _MODULE_PATH_MAP-gated URL
prefixes — activating/deactivating a row here takes effect on the VERY NEXT
request (subject to the middleware's 300s cache, see _check_module_access).

B07 §5.3: RBAC-enforced, deny by default.
Required permissions (added to sync_rbac.py's PERMISSION_CATALOGUE):
  - List/Retrieve:        business_unit.businessunitmodule.view
  - Activate:             business_unit.businessunitmodule.activate
  - Deactivate/Suspend:   business_unit.businessunitmodule.deactivate
  - Set plan_limit:       business_unit.businessunitmodule.manage

E04 §3.4: activate/deactivate run module_dependency_validator first —
ModuleNotActiveError/ModuleConfigurationError propagate to
global_exception_handler automatically (no try/except needed here, mirroring
how RoleSerializer.validate_permission_code_list lets ValidationError
propagate to DRF's exception handler).

Plan entitlement (E04 §3 "PlanModule"): activation also checks whether the
BU's Organization's active SubscriptionPlan includes this module
(PlanModule.is_included). If not, ModuleNotSubscribedException (402-style
403, apps.platform.core_exceptions) is raised — this is the SAME exception class
ModuleSubscriptionMiddleware would eventually 403 with anyway, surfaced
proactively at activation time instead of on first use.

B01: BusinessUnitModule has no soft-delete fields beyond TenantModel's
standard is_deleted/deleted_at (inherited) — but "deletion" of a module
subscription is modeled as a STATUS TRANSITION (→ SUSPENDED/EXPIRED), not a
row deletion, per E04 §3.2's status enum. destroy() is therefore NOT
exposed; deactivate/suspend actions are the only state-changing write paths
besides activate and set_plan_limit. This mirrors RoleViewSet's "SYSTEM
roles cannot be deleted" pattern — here, EVERY BusinessUnitModule row is
permanent-but-stateful (a BU's subscription history to a module is
meaningful audit data, never erased).
"""
from __future__ import annotations

import logging
import uuid

from django.db.models import QuerySet
from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response
from drf_spectacular.utils import extend_schema, extend_schema_view, OpenApiParameter

from core.base.base_viewset import BaseViewSet
from core.responses import SuccessResponse, CreatedResponse
from core.permissions.rbac_permission import HasRBACPermission
from apps.platform.core_exceptions import ModuleNotSubscribedException
from apps.organization.models import BusinessUnit, BusinessUnitModule
from apps.organization.api.serializers.business_unit_module_serializer import (
    BusinessUnitModuleSerializer, BusinessUnitModuleListSerializer,
)
from apps.platform.governance.module_dependency_validator import (
    validate_activation, validate_deactivation,
)

logger = logging.getLogger(__name__)


@extend_schema_view(
    list=extend_schema(
        summary="List module subscription/access status for a Business Unit",
        parameters=[
            OpenApiParameter("business_unit_id", str, required=True,
                              description="BU UUID — required, no cross-BU listing"),
            OpenApiParameter("status", str,
                              description="Filter: active|trial|suspended|expired"),
        ],
    ),
    retrieve=extend_schema(summary="Get a single BusinessUnitModule row"),
)
class BusinessUnitModuleViewSet(BaseViewSet):
    """
    Read/activate/deactivate/suspend BusinessUnitModule rows for a single
    Business Unit. Always scoped by ?business_unit_id= (required) — there
    is no "list across all BUs" endpoint, matching
    UserBusinessUnitViewSet's ?business_unit_id= convention and avoiding
    an accidental cross-tenant listing surface.

    Rows for ALL 18 PlatformModule codes are guaranteed to exist for every
    active BU because `activate`/`list` lazily create missing rows in
    INACTIVE-equivalent state... actually BusinessUnitModule has no INACTIVE
    status (Status = ACTIVE|TRIAL|SUSPENDED|EXPIRED — "not yet subscribed"
    is modeled as "no row exists"). `list` therefore returns the UNION of
    (a) existing BusinessUnitModule rows for this BU and (b) PlatformModule
    codes with NO row yet, presented as a synthetic "not_subscribed" entry
    — so the frontend can render all 18 modules with a consistent
    activate/deactivate affordance regardless of whether a row exists.
    """
    permission_classes = [IsAuthenticated, HasRBACPermission]
    required_permissions = ["business_unit.businessunitmodule.view"]

    WRITE_PERMISSIONS = {
        "activate":       ["business_unit.businessunitmodule.activate"],
        "deactivate":     ["business_unit.businessunitmodule.deactivate"],
        "suspend":        ["business_unit.businessunitmodule.deactivate"],
        "set_plan_limit": ["business_unit.businessunitmodule.manage"],
    }

    def get_serializer_class(self):
        if self.action == "list":
            return BusinessUnitModuleListSerializer
        return BusinessUnitModuleSerializer

    def check_write_permission(self) -> None:
        """Gate state-changing actions on top of the base 'view' permission."""
        required = self.WRITE_PERMISSIONS.get(self.action, [])
        if not required:
            return
        if getattr(self.request.user, "is_super_admin", False):
            return
        sc = getattr(self.request, "security_context", None)
        if sc is None:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("No security context. Ensure you are authenticated.")
        for perm in required:
            if perm not in sc.permissions:
                from rest_framework.exceptions import PermissionDenied
                raise PermissionDenied(
                    f"You do not have the '{perm}' permission required for this action."
                )

    def _get_business_unit(self) -> BusinessUnit:
        """
        Resolves and authorizes ?business_unit_id= for this request.
        Non-super-admins are scoped to BUs within their organization
        (mirrors BusinessUnitViewSet._get_org_id() org-scoping).
        """
        from rest_framework.exceptions import NotFound, ValidationError

        bu_id = self.request.query_params.get("business_unit_id")
        if not bu_id:
            raise ValidationError({"business_unit_id": "This query parameter is required."})
        try:
            bu = BusinessUnit.objects.get(pk=bu_id, is_deleted=False)
        except (BusinessUnit.DoesNotExist, ValueError):
            raise NotFound("Business Unit not found.")

        if not getattr(self.request.user, "is_super_admin", False):
            org_id = getattr(self.request.user, "organization_id", None)
            if str(bu.organization_id) != str(org_id):
                raise NotFound("Business Unit not found.")

        return bu

    def get_queryset(self) -> QuerySet:
        bu = self._get_business_unit()
        qs = BusinessUnitModule.objects.filter(business_unit_id=bu.id).select_related("module")

        status_param = self.request.query_params.get("status")
        if status_param:
            qs = qs.filter(status=status_param)

        return qs.order_by("module__sort_order", "module__name")

    def list(self, request: Request, *args, **kwargs) -> Response:
        """
        Returns the UNION of existing BusinessUnitModule rows and
        PlatformModule codes with no row yet (as synthetic "not_subscribed"
        entries) — see class docstring. The synthetic entries have
        `id: null` and `status: "not_subscribed"` so the frontend can
        distinguish "never activated" from any real BusinessUnitModule
        status, and so `activate` (which creates the row) is the only
        valid write action for these entries.
        """
        from apps.tenancy.models import PlatformModule

        bu = self._get_business_unit()
        queryset = self.filter_queryset(self.get_queryset())
        existing = self.get_serializer(queryset, many=True).data
        existing_codes = {row["module"]["code"] for row in existing}

        status_filter = request.query_params.get("status")
        synthetic: list[dict] = []
        if not status_filter or status_filter == "not_subscribed":
            from apps.organization.api.serializers.business_unit_module_serializer import (
                PlatformModuleSerializer,
            )
            missing_modules = PlatformModule.objects.filter(is_active=True).exclude(
                code__in=existing_codes
            ).order_by("sort_order", "name")
            for module in missing_modules:
                synthetic.append({
                    "id": None,
                    "business_unit_id": str(bu.id),
                    "module": PlatformModuleSerializer(module).data,
                    "status": "not_subscribed",
                    "is_active": False,
                    "plan_limit": {},
                    "trial_ends_at": None,
                    "activated_at": None,
                    "expires_at": None,
                    "activated_by_id": None,
                })

        combined = list(existing) + synthetic
        # Stable order matches PlatformModule.sort_order (already applied to
        # `existing` via get_queryset's order_by and to `synthetic` above).
        combined.sort(key=lambda r: r["module"]["sort_order"])

        return SuccessResponse(data=combined, meta={"count": len(combined)})

    @extend_schema(
        summary="Activate (or re-activate) a module for this Business Unit",
        request={"application/json": {"type": "object", "properties": {
            "module_code": {"type": "string", "description": "PlatformModule.code, e.g. 'payroll'"},
            "status": {"type": "string", "description": "active|trial (default: active)"},
            "trial_ends_at": {"type": "string", "format": "date-time", "required": False},
            "plan_limit": {"type": "object", "required": False},
        }}},
        responses={200: BusinessUnitModuleSerializer},
    )
    @action(detail=False, methods=["post"], url_path="activate")
    def activate(self, request: Request, *args, **kwargs) -> Response:
        """
        Activates `module_code` for the BU in ?business_unit_id=.

        Order of checks (each can short-circuit with a distinct error):
          1. module_dependency_validator.validate_activation — E04 §3.4
             (raises ModuleNotActiveError 400 / ModuleConfigurationError 500)
          2. Plan entitlement — the BU's active
             BusinessUnitSubscription.plan must have PlanModule(is_included=True)
             for this module, UNLESS the module is_free (raises
             ModuleNotSubscribedException, mapped to 403 via global_exception_handler)
          3. get_or_create the BusinessUnitModule row, set status=ACTIVE/TRIAL,
             activated_by=request.user, activated_at=now, clear expires_at
             unless explicitly provided.

        Idempotent: re-activating an already-ACTIVE module just refreshes
        activated_at/activated_by (useful for "renew" semantics).
        """
        self.check_write_permission()
        from rest_framework.exceptions import ValidationError
        from apps.tenancy.models import PlatformModule, PlanModule, BusinessUnitSubscription

        bu = self._get_business_unit()
        module_code = request.data.get("module_code")
        if not module_code:
            raise ValidationError({"module_code": "This field is required."})

        try:
            module = PlatformModule.objects.get(code=module_code, is_active=True)
        except PlatformModule.DoesNotExist:
            raise ValidationError({"module_code": f"'{module_code}' is not a recognised platform module."})

        # 1. E04 §3.4 dependency check.
        validate_activation(bu.id, module_code)

        # 2. Plan entitlement check (skip for is_free modules).
        if not module.is_free:
            active_sub = (
                BusinessUnitSubscription.objects
                .filter(business_unit_id=bu.id,
                        status__in=[BusinessUnitSubscription.Status.ACTIVE,
                                     BusinessUnitSubscription.Status.TRIALING])
                .order_by("-created_at")
                .first()
            )
            if active_sub:
                entitled = PlanModule.objects.filter(
                    plan=active_sub.plan, module=module, is_included=True
                ).exists()
                if not entitled:
                    raise ModuleNotSubscribedException(
                        f"Your organization's '{active_sub.plan.code}' plan does not "
                        f"include the '{module.name}' module. Please upgrade your "
                        f"subscription or contact your administrator."
                    )
            # No active subscription at all: fail-open here is intentional —
            # BusinessUnitSubscription seeding is outside this fix's scope
            # (see IMPLEMENTATION_PLAN.md), and ModuleSubscriptionMiddleware
            # itself is documented as "fail-open" on cache/lookup errors
            # (E04 §3.3) to avoid hard-locking tenants out due to billing-
            # system gaps. A BU with no subscription record can still
            # activate modules; this is a tracked follow-up once
            # BusinessUnitSubscription seeding lands.

        # 3. Create/update the row.
        requested_status = request.data.get("status", BusinessUnitModule.Status.ACTIVE)
        if requested_status not in (BusinessUnitModule.Status.ACTIVE, BusinessUnitModule.Status.TRIAL):
            raise ValidationError({"status": "Must be 'active' or 'trial' for activation."})

        defaults = {
            "status": requested_status,
            "activated_by_id": getattr(request.user, "id", None),
            "activated_at": timezone.now(),
            "updated_by_id": getattr(request.user, "id", None),
        }
        reason = request.data.get("reason", "")
        if "trial_ends_at" in request.data:
            defaults["trial_ends_at"] = request.data.get("trial_ends_at")
        if "plan_limit" in request.data:
            defaults["plan_limit"] = request.data.get("plan_limit") or {}
        # Re-activation clears any prior expiry unless caller explicitly sets one.
        defaults["expires_at"] = request.data.get("expires_at")

        bum, was_created = BusinessUnitModule.objects.get_or_create(
            business_unit_id=bu.id, module=module, defaults={**defaults, "created_by_id": defaults["updated_by_id"], "created_reason": reason, "updated_reason": reason},
        )
        if not was_created:
            for field, value in defaults.items():
                setattr(bum, field, value)
            if reason:
                bum.updated_reason = reason
            bum.save()

        logger.info(
            "BusinessUnitModule %s: BU=%s module=%s status=%s (created=%s) by user=%s",
            bum.id, bu.id, module_code, bum.status, was_created, request.user.id,
        )

        if was_created:
            return CreatedResponse(
                data=BusinessUnitModuleSerializer(bum, context={"request": request}).data,
                message=f"'{module.name}' activated for this Business Unit.",
            )
        return SuccessResponse(
            data=BusinessUnitModuleSerializer(bum, context={"request": request}).data,
            message=f"'{module.name}' re-activated for this Business Unit.",
        )

    @extend_schema(
        summary="Deactivate (suspend) a module for this Business Unit",
        request={"application/json": {"type": "object", "properties": {
            "module_code": {"type": "string"},
        }}},
        responses={200: BusinessUnitModuleSerializer},
    )
    @action(detail=False, methods=["post"], url_path="deactivate")
    def deactivate(self, request: Request, *args, **kwargs) -> Response:
        """
        Sets status=SUSPENDED for `module_code` on this BU, after running
        module_dependency_validator.validate_deactivation (E04 §3.4
        symmetric check — cannot deactivate a module that other ACTIVE
        modules on this BU depend on).

        Distinct from `suspend` only in audit framing (deactivate = user-
        initiated "I don't need this anymore"; suspend = admin-initiated
        "this BU's access is being paused", e.g. for non-payment) — both
        set the same SUSPENDED status; the difference is which permission
        code gates them and the log message. Both map to
        WRITE_PERMISSIONS["deactivate"|"suspend"] =
        business_unit.businessunitmodule.deactivate (same code — there is
        currently no distinct "suspend" permission in the catalogue; see
        sync_rbac.py PERMISSION_CATALOGUE additions).
        """
        self.check_write_permission()
        return self._set_status(
            request, target_status=BusinessUnitModule.Status.SUSPENDED,
            action_label="deactivated",
        )

    @extend_schema(
        summary="Suspend a module for this Business Unit (admin action)",
        request={"application/json": {"type": "object", "properties": {
            "module_code": {"type": "string"},
        }}},
        responses={200: BusinessUnitModuleSerializer},
    )
    @action(detail=False, methods=["post"], url_path="suspend")
    def suspend(self, request: Request, *args, **kwargs) -> Response:
        self.check_write_permission()
        return self._set_status(
            request, target_status=BusinessUnitModule.Status.SUSPENDED,
            action_label="suspended",
        )

    def _set_status(self, request: Request, target_status: str, action_label: str) -> Response:
        from rest_framework.exceptions import ValidationError, NotFound

        bu = self._get_business_unit()
        module_code = request.data.get("module_code")
        reason = request.data.get("reason", "")
        if not module_code:
            raise ValidationError({"module_code": "This field is required."})

        try:
            bum = BusinessUnitModule.objects.select_related("module").get(
                business_unit_id=bu.id, module__code=module_code,
            )
        except BusinessUnitModule.DoesNotExist:
            raise NotFound(f"'{module_code}' has not been activated for this Business Unit.")

        if target_status == BusinessUnitModule.Status.SUSPENDED:
            validate_deactivation(bu.id, module_code)

        bum.status = target_status
        bum.updated_by_id = getattr(request.user, "id", None)
        if reason:
            bum.updated_reason = reason
        bum.save(update_fields=["status", "updated_at", "updated_by_id", "updated_reason"])

        logger.info(
            "BusinessUnitModule %s: BU=%s module=%s %s by user=%s",
            bum.id, bu.id, module_code, action_label, request.user.id,
        )

        return SuccessResponse(
            data=BusinessUnitModuleSerializer(bum, context={"request": request}).data,
            message=f"'{bum.module.name}' {action_label} for this Business Unit.",
        )

    @extend_schema(
        summary="Set a custom plan_limit override for a module on this Business Unit",
        request={"application/json": {"type": "object", "properties": {
            "module_code": {"type": "string"},
            "plan_limit": {"type": "object"},
        }}},
        responses={200: BusinessUnitModuleSerializer},
    )
    @action(detail=False, methods=["post"], url_path="set-plan-limit")
    def set_plan_limit(self, request: Request, *args, **kwargs) -> Response:
        """
        Overrides plan_limit (JSONB) for an already-activated module on this
        BU — e.g. {"max_employees": 50} for hrms, independent of the
        organization-wide SubscriptionPlan limits. Module must already be
        activated (status row must exist) — use `activate` first.
        """
        self.check_write_permission()
        from rest_framework.exceptions import ValidationError, NotFound

        bu = self._get_business_unit()
        module_code = request.data.get("module_code")
        plan_limit = request.data.get("plan_limit")
        reason = request.data.get("reason", "")

        if not module_code:
            raise ValidationError({"module_code": "This field is required."})
        if plan_limit is None or not isinstance(plan_limit, dict):
            raise ValidationError({"plan_limit": "This field is required and must be an object."})

        try:
            bum = BusinessUnitModule.objects.select_related("module").get(
                business_unit_id=bu.id, module__code=module_code,
            )
        except BusinessUnitModule.DoesNotExist:
            raise NotFound(f"'{module_code}' has not been activated for this Business Unit. Activate it first.")

        bum.plan_limit = plan_limit
        bum.updated_by_id = getattr(request.user, "id", None)
        if reason:
            bum.updated_reason = reason
        bum.save(update_fields=["plan_limit", "updated_at", "updated_by_id", "updated_reason"])

        return SuccessResponse(
            data=BusinessUnitModuleSerializer(bum, context={"request": request}).data,
            message=f"Plan limit updated for '{bum.module.name}'.",
        )
