# yss_orbit\backend\apps\pqm\services\notification_service.py
"""
PQM Notification Service — template-driven dispatch (email + in-app).
Every send is logged to pqm_notification_log regardless of outcome.
Errors NEVER raise to callers — fire-and-forget pattern.
"""
from __future__ import annotations

import logging
from typing import Optional

from django.utils import timezone

from apps.pqm.enums import NotificationChannel

logger = logging.getLogger(__name__)

# Event → (channels, recipient_resolver_name)
EVENT_CONFIG: dict[str, dict] = {
    "nc_submitted":              {"channels": [NotificationChannel.EMAIL, NotificationChannel.IN_APP]},
    "nc_safety_critical":        {"channels": [NotificationChannel.EMAIL, NotificationChannel.IN_APP]},
    "nc_approved_review":        {"channels": [NotificationChannel.IN_APP]},
    "nc_rejected":               {"channels": [NotificationChannel.EMAIL, NotificationChannel.IN_APP]},
    "nc_assigned":               {"channels": [NotificationChannel.EMAIL, NotificationChannel.IN_APP]},
    "nc_due_approaching":        {"channels": [NotificationChannel.IN_APP]},
    "nc_overdue_escalation":     {"channels": [NotificationChannel.EMAIL, NotificationChannel.IN_APP]},
    "nc_extension_requested":    {"channels": [NotificationChannel.EMAIL, NotificationChannel.IN_APP]},
    "nc_extension_decided":      {"channels": [NotificationChannel.EMAIL, NotificationChannel.IN_APP]},
    "nc_closure_requested":      {"channels": [NotificationChannel.EMAIL, NotificationChannel.IN_APP]},
    "nc_verification_approved":  {"channels": [NotificationChannel.IN_APP]},
    "nc_verification_rejected":  {"channels": [NotificationChannel.EMAIL, NotificationChannel.IN_APP]},
    "nc_closed":                 {"channels": [NotificationChannel.IN_APP]},
    "nc_reopened":               {"channels": [NotificationChannel.EMAIL, NotificationChannel.IN_APP]},
    "nc_merged":                 {"channels": [NotificationChannel.IN_APP]},
}


class NotificationService:

    @staticmethod
    def send_nc_event(
        nc: "NonConformance",  # type: ignore[name-defined]
        event_type: str,
        extra_recipient_ids: Optional[list] = None,
    ) -> None:
        """
        Dispatch notifications for an NC event.
        Logs every attempt to pqm_notification_log — errors never propagate.
        """
        from apps.pqm.models.notification_log import PQMNotificationLog

        config = EVENT_CONFIG.get(event_type, {"channels": [NotificationChannel.IN_APP]})
        channels = config["channels"]
        recipient_ids = NotificationService._resolve_recipients(nc, event_type, extra_recipient_ids)

        for recipient_id in recipient_ids:
            for channel in channels:
                log = PQMNotificationLog(
                    organization_id=nc.organization_id,
                    business_unit_id=nc.business_unit_id,
                    nc=nc,
                    event_type=event_type,
                    channel=channel,
                    recipient_id=recipient_id,
                    status="queued",
                )
                try:
                    log.save()
                    NotificationService._dispatch(log, nc, event_type)
                    log.status = "sent"
                    log.sent_at = timezone.now()
                    log.save(update_fields=["status", "sent_at"])
                except Exception as exc:
                    logger.warning(
                        "PQM notification failed: event=%s recipient=%s channel=%s err=%s",
                        event_type, recipient_id, channel, exc,
                    )
                    try:
                        log.status = "failed"
                        log.error_detail = str(exc)
                        log.save(update_fields=["status", "error_detail"])
                    except Exception:
                        pass  # log table write failure is non-fatal

    @staticmethod
    def _resolve_recipients(nc: object, event_type: str, extra_ids: Optional[list]) -> list:
        """Resolve recipient user IDs based on event type and NC roles."""
        recipients: set = set()

        nc_obj = nc  # type annotation hint
        raised_by = getattr(nc_obj, "raised_by_id", None)
        assigned_to = getattr(nc_obj, "assigned_to_id", None)
        site_incharge = getattr(nc_obj, "site_incharge_id", None)
        site_quality = getattr(nc_obj, "site_quality_incharge_id", None)
        project_incharge = getattr(nc_obj, "project_incharge_id", None)

        if event_type in ("nc_submitted", "nc_safety_critical"):
            for uid in [site_incharge, site_quality, project_incharge]:
                if uid:
                    recipients.add(str(uid))
        elif event_type in ("nc_approved_review", "nc_closed", "nc_merged"):
            if raised_by:
                recipients.add(str(raised_by))
        elif event_type in ("nc_rejected", "nc_reopened", "nc_extension_decided"):
            if raised_by:
                recipients.add(str(raised_by))
        elif event_type in ("nc_assigned",):
            if assigned_to:
                recipients.add(str(assigned_to))
        elif event_type in ("nc_due_approaching", "nc_verification_rejected"):
            if assigned_to:
                recipients.add(str(assigned_to))
        elif event_type in ("nc_closure_requested", "nc_verification_approved"):
            if raised_by:
                recipients.add(str(raised_by))
            if assigned_to:
                recipients.add(str(assigned_to))
        elif event_type == "nc_extension_requested":
            if site_incharge:
                recipients.add(str(site_incharge))
            if project_incharge:
                recipients.add(str(project_incharge))

        if extra_ids:
            recipients.update(str(uid) for uid in extra_ids if uid)

        return list(recipients)

    @staticmethod
    def _dispatch(log: object, nc: object, event_type: str) -> None:
        """
        Attempt to dispatch via existing platform notification infrastructure.
        Gracefully degrades if platform notification service is unavailable.
        """
        try:
            from apps.platform.services.notification_service import PlatformNotificationService  # type: ignore
            PlatformNotificationService.send(
                recipient_id=str(getattr(log, "recipient_id")),
                channel=getattr(log, "channel"),
                subject=f"[PQM] NC Event: {event_type}",
                body=f"NC {getattr(nc, 'nc_number', '')} — {event_type.replace('_', ' ').title()}",
            )
        except ImportError:
            # Platform notification service not yet integrated — log only
            logger.debug("Platform notification service unavailable; log-only mode for PQM.")
        except Exception as exc:
            raise exc  # re-raise so caller can mark log as failed
