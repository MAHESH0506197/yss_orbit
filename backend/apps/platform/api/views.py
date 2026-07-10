# yss_orbit/backend/apps/notifications/api/views.py
"""
YSS Orbit — Notification API Views
====================================
Phase 4: API Layer Audit

GET  /api/v1/notifications/preferences/         — list all preferences for the current user
GET  /api/v1/notifications/preferences/{event_type}/  — get single preference
PATCH /api/v1/notifications/preferences/{event_type}/ — update single preference (ESS)

GET  /api/v1/notifications/inbox/               — in-app notification inbox (current user)
POST /api/v1/notifications/inbox/{log_id}/read/ — mark notification as read

All endpoints are ESS-scoped to request.user — users can only manage their own preferences.
"""
from __future__ import annotations

import uuid
import logging

from rest_framework.views import APIView
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from apps.platform.core_response import success_response, error_response
from apps.hrms.api.views.utils import _require_bu
from apps.platform.models import NotificationLog, NotificationPreference, NotificationTemplate

logger = logging.getLogger(__name__)


# ── Notification Preferences (ESS — current user only) ────────────────────────

class NotificationPreferenceListView(APIView):
    """
    GET /api/v1/notifications/preferences/

    Returns all notification preferences for the authenticated user.
    If no preference record exists for an event type, default values are returned.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request: Request) -> Response:
        bu_id, err = _require_bu(request)
        if err:
            return err

        user_id = request.user.id

        # Fetch all event types from NotificationTemplate choices
        all_event_types = [et[0] for et in NotificationTemplate.EventType.choices]

        # Load existing preferences
        existing = {
            pref.event_type: pref
            for pref in NotificationPreference.objects.filter(
                business_unit_id=bu_id,
                user_id=user_id,
            )
        }

        # Build response — fill in defaults for missing preferences
        data = []
        for event_type in all_event_types:
            pref = existing.get(event_type)
            data.append({
                "event_type": event_type,
                "email_enabled": pref.email_enabled if pref else True,
                "sms_enabled": pref.sms_enabled if pref else False,
                "push_enabled": pref.push_enabled if pref else True,
                "in_app_enabled": pref.in_app_enabled if pref else True,
            })

        return success_response(data=data, request=request)


class NotificationPreferenceDetailView(APIView):
    """
    GET   /api/v1/notifications/preferences/{event_type}/
    PATCH /api/v1/notifications/preferences/{event_type}/

    Get or update the authenticated user's notification preference for a specific event type.
    Uses upsert — creates the preference record if it doesn't exist yet.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request: Request, event_type: str) -> Response:
        bu_id, err = _require_bu(request)
        if err:
            return err

        user_id = request.user.id

        pref = NotificationPreference.objects.filter(
            business_unit_id=bu_id,
            user_id=user_id,
            event_type=event_type,
        ).first()

        data = {
            "event_type": event_type,
            "email_enabled": pref.email_enabled if pref else True,
            "sms_enabled": pref.sms_enabled if pref else False,
            "push_enabled": pref.push_enabled if pref else True,
            "in_app_enabled": pref.in_app_enabled if pref else True,
        }
        return success_response(data=data, request=request)

    def patch(self, request: Request, event_type: str) -> Response:
        bu_id, err = _require_bu(request)
        if err:
            return err

        user_id = request.user.id

        # Validate event_type is known
        valid_types = [et[0] for et in NotificationTemplate.EventType.choices]
        if event_type not in valid_types:
            return error_response(
                "INVALID_EVENT_TYPE",
                f"Unknown event_type '{event_type}'. Valid types: {valid_types}",
                http_status=400,
                request=request,
            )

        # Validate incoming fields
        allowed_fields = {"email_enabled", "sms_enabled", "push_enabled", "in_app_enabled"}
        updates = {k: v for k, v in request.data.items() if k in allowed_fields}

        if not updates:
            return error_response(
                "NO_FIELDS",
                f"Provide at least one of: {sorted(allowed_fields)}",
                http_status=400,
                request=request,
            )

        # Validate booleans
        for field, value in updates.items():
            if not isinstance(value, bool):
                return error_response(
                    "VALIDATION_ERROR",
                    f"Field '{field}' must be a boolean.",
                    http_status=400,
                    request=request,
                )

        # Upsert — create or update
        pref, created = NotificationPreference.objects.get_or_create(
            business_unit_id=bu_id,
            user_id=user_id,
            event_type=event_type,
            defaults={
                "email_enabled": True,
                "sms_enabled": False,
                "push_enabled": True,
                "in_app_enabled": True,
            },
        )

        for field, value in updates.items():
            setattr(pref, field, value)
        pref.save(update_fields=list(updates.keys()) + ["updated_at"])

        data = {
            "event_type": event_type,
            "email_enabled": pref.email_enabled,
            "sms_enabled": pref.sms_enabled,
            "push_enabled": pref.push_enabled,
            "in_app_enabled": pref.in_app_enabled,
            "created": created,
        }

        logger.info(
            "NotificationPreference updated: user=%s event_type=%s updates=%s",
            user_id, event_type, updates,
        )
        return success_response(data=data, request=request)


# ── In-App Notification Inbox (ESS — current user only) ──────────────────────

class NotificationInboxView(APIView):
    """
    GET /api/v1/notifications/inbox/

    Returns paginated in-app notifications for the authenticated user.
    Query params:
      ?status=SENT|FAILED   — filter by status (default: SENT)
      ?page=1               — page number
      ?page_size=20         — items per page (max 50)
    """
    permission_classes = [IsAuthenticated]

    def get(self, request: Request) -> Response:
        bu_id, err = _require_bu(request)
        if err:
            return err

        user_id = request.user.id
        status_filter = request.query_params.get("status", NotificationLog.Status.SENT)

        qs = NotificationLog.objects.filter(
            business_unit_id=bu_id,
            recipient_user_id=user_id,
            channel=NotificationLog.Channel.IN_APP,
        ).order_by("-created_at")

        if status_filter in [s[0] for s in NotificationLog.Status.choices]:
            qs = qs.filter(status=status_filter)

        page_size = min(int(request.query_params.get("page_size", 20)), 50)
        page = max(int(request.query_params.get("page", 1)), 1)
        offset = (page - 1) * page_size
        total = qs.count()
        items = qs[offset: offset + page_size]

        data = [
            {
                "id": str(n.id),
                "event_type": n.event_type,
                "subject": n.subject,
                "body": n.body,
                "status": n.status,
                "sent_at": n.sent_at.isoformat() if n.sent_at else None,
                "created_at": n.created_at.isoformat() if n.created_at else None,
            }
            for n in items
        ]

        return success_response(
            data=data,
            meta={"total": total, "page": page, "page_size": page_size},
            request=request,
        )
