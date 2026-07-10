# yss_orbit\backend\apps\notification\notification_views.py
"""
YSS Orbit — Notification DRF Views

Endpoints:
    GET  /api/v1/notifications/               → list (unread first)
    POST /api/v1/notifications/{id}/read/     → mark one notification read
    POST /api/v1/notifications/read-all/      → mark all notifications read
    GET  /api/v1/notifications/unread-count/  → {count: N}

All views:
- Require authentication (IsAuthenticated)
- Require business unit context (IsTenantMember)
- Call NotificationService — NEVER query ORM directly
- Return success_response() / error_response() exclusively
"""
from __future__ import annotations

import logging
import uuid

from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.platform.core_exceptions import ResourceNotFoundException
from apps.platform.core_pagination import CursorResultsPagination
from apps.platform.core_permissions import IsAuthenticated, IsTenantMember
from apps.platform.core_response import error_response, success_response
from apps.platform.notification_serializer import (
    NotificationSerializer,
    NotificationUnreadCountSerializer,
)
from apps.platform.notification_service import NotificationService
from apps.iam.security_context import SecurityContext

logger = logging.getLogger(__name__)


def _get_ctx(request: Request) -> SecurityContext:
    """Extract SecurityContext — guaranteed by IsAuthenticated permission."""
    return request.security_context  # type: ignore[attr-defined]


class NotificationListView(APIView):
    """
    GET /api/v1/notifications/

    Returns all notifications for the authenticated user in the current
    business unit, unread-first then by created_at descending.
    Uses cursor-based pagination for scalability.
    """

    permission_classes = [IsAuthenticated, IsTenantMember]

    def get(self, request: Request) -> Response:
        ctx = _get_ctx(request)
        business_unit_id: uuid.UUID = ctx.require_business_unit()

        qs = NotificationService.list_notifications(
            user_id=ctx.user_id,
            business_unit_id=business_unit_id,
        )

        paginator = CursorResultsPagination()
        paginator.ordering = "is_read,-created_at"  # unread first
        page = paginator.paginate_queryset(qs, request)

        if page is not None:
            serializer = NotificationSerializer(page, many=True)
            logger.info(
                "Notification list fetched",
                extra={
                    "user_id": str(ctx.user_id),
                    "business_unit_id": str(business_unit_id),
                    "correlation_id": ctx.correlation_id,
                },
            )
            return paginator.get_paginated_response(serializer.data)

        serializer = NotificationSerializer(qs, many=True)
        return success_response(data=serializer.data, request=request)


class NotificationMarkReadView(APIView):
    """
    POST /api/v1/notifications/{id}/read/

    Marks a single notification as read.  The notification must belong to
    the authenticated user (enforced by NotificationService.mark_read).
    """

    permission_classes = [IsAuthenticated, IsTenantMember]

    def post(self, request: Request, notification_id: str) -> Response:
        ctx = _get_ctx(request)

        try:
            nid = uuid.UUID(notification_id)
        except ValueError:
            return error_response(
                error_code="NOTIF_001",
                message="Invalid notification ID format.",
                http_status=400,
                request=request,
            )

        try:
            notification = NotificationService.mark_read(
                notification_id=nid,
                user_id=ctx.user_id,
            )
        except ResourceNotFoundException:
            return error_response(
                error_code="NOTIF_002",
                message="Notification not found.",
                http_status=404,
                request=request,
            )

        serializer = NotificationSerializer(notification)
        logger.info(
            "Notification marked read",
            extra={
                "notification_id": notification_id,
                "user_id": str(ctx.user_id),
                "correlation_id": ctx.correlation_id,
            },
        )
        return success_response(
            data=serializer.data,
            message="Notification marked as read.",
            request=request,
        )


class NotificationMarkAllReadView(APIView):
    """
    POST /api/v1/notifications/read-all/

    Marks ALL unread notifications for the authenticated user in the
    current business unit as read.
    """

    permission_classes = [IsAuthenticated, IsTenantMember]

    def post(self, request: Request) -> Response:
        ctx = _get_ctx(request)
        business_unit_id: uuid.UUID = ctx.require_business_unit()

        count = NotificationService.mark_all_read(
            user_id=ctx.user_id,
            business_unit_id=business_unit_id,
        )

        logger.info(
            "All notifications marked as read",
            extra={
                "user_id": str(ctx.user_id),
                "business_unit_id": str(business_unit_id),
                "count": count,
                "correlation_id": ctx.correlation_id,
            },
        )
        return success_response(
            data={"updated_count": count},
            message=f"{count} notification(s) marked as read.",
            request=request,
        )


class NotificationUnreadCountView(APIView):
    """
    GET /api/v1/notifications/unread-count/

    Returns the unread notification count for the authenticated user.
    Lightweight endpoint — used by frontend to update badge counts.
    """

    permission_classes = [IsAuthenticated, IsTenantMember]

    def get(self, request: Request) -> Response:
        ctx = _get_ctx(request)
        business_unit_id: uuid.UUID = ctx.require_business_unit()

        count = NotificationService.get_unread_count(
            user_id=ctx.user_id,
            business_unit_id=business_unit_id,
        )

        serializer = NotificationUnreadCountSerializer({"count": count})
        return success_response(data=serializer.data, request=request)
