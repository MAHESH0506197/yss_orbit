# yss_orbit\backend\apps\subscription\api\subscription_views.py
"""
YSS Orbit — Subscription Views
"""
from __future__ import annotations

import uuid

from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.tenancy.api.serializers.subscription_serializer import BusinessUnitSubscriptionSerializer, SubscriptionPlanSerializer
from apps.tenancy.services.subscription_service import SubscriptionService
from apps.tenancy.services.subscription_upgrade_service import SubscriptionUpgradeService
from apps.tenancy.models import SubscriptionPlan
from apps.platform.core_permissions import IsAuthenticated
from apps.platform.core_response import success_response, created_response
from apps.platform.core_exceptions import ValidationException
from apps.iam.security_context import SecurityContext

_sub_service = SubscriptionService()
_upgrade_service = SubscriptionUpgradeService()


def _get_ctx(request: Request) -> SecurityContext:
    ctx: SecurityContext | None = getattr(request, "security_context", None)
    if ctx is None:
        from apps.platform.core_exceptions import AuthException
        raise AuthException(message="Authentication required.")
    return ctx


class SubscriptionPlanListView(APIView):
    """GET /api/v1/subscriptions/plans/"""
    permission_classes = [IsAuthenticated]

    def get(self, request: Request) -> Response:
        plans = SubscriptionPlan.objects.filter(is_active=True).prefetch_related("modules").order_by("sort_order")
        serializer = SubscriptionPlanSerializer(plans, many=True)
        return success_response(data=serializer.data, message="Plans retrieved.", request=request)


class BusinessUnitSubscriptionView(APIView):
    """
    GET /api/v1/subscriptions/business-units/{business_unit_id}/
    POST /api/v1/subscriptions/business-units/{business_unit_id}/trial/
    """
    permission_classes = [IsAuthenticated]

    def get(self, request: Request, business_unit_id: str) -> Response:
        try:
            bu_id = uuid.UUID(business_unit_id)
        except ValueError:
            raise ValidationException("Invalid business unit ID.")
            
        sub = _sub_service.get_business_unit_subscription(bu_id)
        serializer = BusinessUnitSubscriptionSerializer(sub)
        return success_response(data=serializer.data, message="Subscription retrieved.", request=request)

    def post(self, request: Request, business_unit_id: str) -> Response:
        """Start a trial"""
        ctx = _get_ctx(request)
        try:
            bu_id = uuid.UUID(business_unit_id)
        except ValueError:
            raise ValidationException("Invalid business unit ID.")
            
        plan_code = request.data.get("plan_code", "BASIC")
        sub = _sub_service.start_trial(ctx, bu_id, plan_code)
        serializer = BusinessUnitSubscriptionSerializer(sub)
        return created_response(data=serializer.data, message="Trial started.", request=request)


class SubscriptionChangePlanView(APIView):
    """POST /api/v1/subscriptions/business-units/{business_unit_id}/change-plan/"""
    permission_classes = [IsAuthenticated]

    def post(self, request: Request, business_unit_id: str) -> Response:
        ctx = _get_ctx(request)
        try:
            bu_id = uuid.UUID(business_unit_id)
        except ValueError:
            raise ValidationException("Invalid business unit ID.")
            
        new_plan_id_str = request.data.get("new_plan_id")
        if not new_plan_id_str:
            raise ValidationException("new_plan_id is required.")
            
        try:
            new_plan_id = uuid.UUID(new_plan_id_str)
        except ValueError:
            raise ValidationException("Invalid new_plan_id UUID.")
            
        billing_cycle = request.data.get("billing_cycle", "MONTHLY")
        
        sub = _upgrade_service.change_plan(ctx, bu_id, new_plan_id, billing_cycle)
        serializer = BusinessUnitSubscriptionSerializer(sub)
        return success_response(data=serializer.data, message="Plan changed successfully.", request=request)


class SubscriptionCancelView(APIView):
    """POST /api/v1/subscriptions/business-units/{business_unit_id}/cancel/"""
    permission_classes = [IsAuthenticated]

    def post(self, request: Request, business_unit_id: str) -> Response:
        ctx = _get_ctx(request)
        try:
            bu_id = uuid.UUID(business_unit_id)
        except ValueError:
            raise ValidationException("Invalid business unit ID.")
            
        sub = _sub_service.cancel_subscription(ctx, bu_id)
        serializer = BusinessUnitSubscriptionSerializer(sub)
        return success_response(data=serializer.data, message="Subscription cancelled.", request=request)
