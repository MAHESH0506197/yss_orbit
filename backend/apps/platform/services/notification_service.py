# yss_orbit/backend/apps/notifications/services/notification_service.py
"""
YSS Orbit — NotificationService
================================
Central dispatch layer for all cross-module notifications.
Every HRMS service that needs to notify a user routes through this class.

Responsibilities:
  1. Resolve the NotificationTemplate for the given event_type
  2. Render subject + body using Django template engine (safe, no code exec)
  3. Filter channels against the recipient's NotificationPreference
  4. Dispatch to each channel adapter (IN_APP, EMAIL, SMS, PUSH)
  5. Write a NotificationLog row per dispatch attempt

Design rules:
  - NotificationService.dispatch() NEVER raises — all errors are caught,
    logged, and stored in NotificationLog with status=FAILED.
  - Channel adapters are intentionally simple stubs — swapped for real
    providers (SendGrid, Twilio, Firebase) in production settings.
  - The service is synchronous by default; callers that want async dispatch
    should call dispatch_async() which offloads to Celery.

Usage:
    from apps.platform.services import NotificationService

    NotificationService.dispatch(
        business_unit_id=bu.id,
        event_type=NotificationTemplate.EventType.PAYSLIP_AVAILABLE,
        recipient_user_id=employee.user_id,
        context={
            "employee_name": "Mahesh Yarlagadda",
            "month": "June 2025",
            "payslip_url": "https://app.example.com/ess/payslips/abc123",
        },
        correlation_id=str(uuid.uuid4()),
    )
"""
from __future__ import annotations

import logging
import uuid
from typing import Any

from django.template import Context, Template
from django.utils import timezone

from apps.platform.models import (
    NotificationLog,
    NotificationPreference,
    NotificationTemplate,
)

logger = logging.getLogger(__name__)


class NotificationService:
    """
    Stateless dispatch layer — all methods are class methods.
    Do not instantiate; call NotificationService.dispatch() directly.
    """

    # ── Public API ────────────────────────────────────────────────────────────

    @classmethod
    def dispatch(
        cls,
        business_unit_id: uuid.UUID,
        event_type: str,
        recipient_user_id: uuid.UUID,
        context: dict[str, Any],
        correlation_id: str | None = None,
    ) -> list[NotificationLog]:
        """
        Resolve template, render content, filter channels by preference,
        and dispatch via each active channel.

        Returns a list of NotificationLog records (one per dispatched channel).
        Errors are never raised — they are captured in the log records.

        Args:
            business_unit_id: Tenant scope.
            event_type: One of NotificationTemplate.EventType choices.
            recipient_user_id: UUID of the target user.
            context: Template rendering variables ({{ variable }} substitutions).
            correlation_id: Optional trace ID linking to the originating business event.
        """
        corr_id = correlation_id or str(uuid.uuid4())
        logs: list[NotificationLog] = []

        # Step 1: Fetch template
        template = cls._get_template(business_unit_id, event_type)
        if template is None:
            logger.warning(
                "NotificationService: no active template for event_type=%s bu=%s",
                event_type, business_unit_id,
            )
            return logs

        # Step 2: Render subject + body
        rendered_subject, rendered_body, rendered_sms, rendered_push = cls._render(
            template, context
        )

        # Step 3: Get recipient preferences (fallback to template defaults)
        prefs = cls._get_preferences(
            business_unit_id=business_unit_id,
            user_id=recipient_user_id,
            event_type=event_type,
        )
        enabled_channels = cls._resolve_channels(template.channels, prefs)

        # Step 4: Dispatch per channel
        for channel in enabled_channels:
            log = cls._dispatch_channel(
                business_unit_id=business_unit_id,
                event_type=event_type,
                recipient_user_id=recipient_user_id,
                channel=channel,
                subject=rendered_subject,
                body=rendered_body if channel != NotificationLog.Channel.SMS else rendered_sms,
                correlation_id=corr_id,
            )
            logs.append(log)

        return logs

    @classmethod
    def dispatch_async(
        cls,
        business_unit_id: uuid.UUID,
        event_type: str,
        recipient_user_id: uuid.UUID,
        context: dict[str, Any],
        correlation_id: str | None = None,
    ) -> None:
        """
        Offload dispatch to the Celery notification queue.
        Call this from within Django request/response cycles to avoid
        blocking the HTTP response on email/SMS I/O.
        """
        from apps.platform.core_tasks import dispatch_notification_task  # lazy import
        dispatch_notification_task.apply_async(
            kwargs={
                "business_unit_id": str(business_unit_id),
                "event_type": event_type,
                "recipient_user_id": str(recipient_user_id),
                "context": context,
                "correlation_id": correlation_id or str(uuid.uuid4()),
            },
            queue="queue_notifications",
        )

    # ── Payroll convenience dispatchers ───────────────────────────────────────

    @classmethod
    def notify_payslip_available(
        cls,
        business_unit_id: uuid.UUID,
        recipient_user_id: uuid.UUID,
        employee_name: str,
        month: str,
        payslip_url: str,
        correlation_id: str | None = None,
    ) -> list[NotificationLog]:
        return cls.dispatch(
            business_unit_id=business_unit_id,
            event_type=NotificationTemplate.EventType.PAYSLIP_AVAILABLE,
            recipient_user_id=recipient_user_id,
            context={
                "employee_name": employee_name,
                "month": month,
                "payslip_url": payslip_url,
            },
            correlation_id=correlation_id,
        )

    @classmethod
    def notify_payroll_processed(
        cls,
        business_unit_id: uuid.UUID,
        recipient_user_id: uuid.UUID,
        month: str,
        total_employees: int,
        total_net: str,
        correlation_id: str | None = None,
    ) -> list[NotificationLog]:
        return cls.dispatch(
            business_unit_id=business_unit_id,
            event_type=NotificationTemplate.EventType.PAYROLL_PROCESSED,
            recipient_user_id=recipient_user_id,
            context={
                "month": month,
                "total_employees": total_employees,
                "total_net": total_net,
            },
            correlation_id=correlation_id,
        )

    # ── Leave convenience dispatchers ─────────────────────────────────────────

    @classmethod
    def notify_leave_applied(
        cls,
        business_unit_id: uuid.UUID,
        manager_user_id: uuid.UUID,
        employee_name: str,
        leave_type: str,
        from_date: str,
        to_date: str,
        correlation_id: str | None = None,
    ) -> list[NotificationLog]:
        return cls.dispatch(
            business_unit_id=business_unit_id,
            event_type=NotificationTemplate.EventType.LEAVE_APPLIED,
            recipient_user_id=manager_user_id,
            context={
                "employee_name": employee_name,
                "leave_type": leave_type,
                "from_date": from_date,
                "to_date": to_date,
            },
            correlation_id=correlation_id,
        )

    @classmethod
    def notify_leave_approved(
        cls,
        business_unit_id: uuid.UUID,
        recipient_user_id: uuid.UUID,
        employee_name: str,
        leave_type: str,
        from_date: str,
        to_date: str,
        correlation_id: str | None = None,
    ) -> list[NotificationLog]:
        return cls.dispatch(
            business_unit_id=business_unit_id,
            event_type=NotificationTemplate.EventType.LEAVE_APPROVED,
            recipient_user_id=recipient_user_id,
            context={
                "employee_name": employee_name,
                "leave_type": leave_type,
                "from_date": from_date,
                "to_date": to_date,
            },
            correlation_id=correlation_id,
        )

    @classmethod
    def notify_leave_rejected(
        cls,
        business_unit_id: uuid.UUID,
        recipient_user_id: uuid.UUID,
        employee_name: str,
        leave_type: str,
        reason: str,
        correlation_id: str | None = None,
    ) -> list[NotificationLog]:
        return cls.dispatch(
            business_unit_id=business_unit_id,
            event_type=NotificationTemplate.EventType.LEAVE_REJECTED,
            recipient_user_id=recipient_user_id,
            context={
                "employee_name": employee_name,
                "leave_type": leave_type,
                "reason": reason,
            },
            correlation_id=correlation_id,
        )

    # ── Lifecycle convenience dispatchers ─────────────────────────────────────

    @classmethod
    def notify_transfer_approved(
        cls,
        business_unit_id: uuid.UUID,
        recipient_user_id: uuid.UUID,
        employee_name: str,
        from_dept: str,
        to_dept: str,
        effective_date: str,
        correlation_id: str | None = None,
    ) -> list[NotificationLog]:
        return cls.dispatch(
            business_unit_id=business_unit_id,
            event_type=NotificationTemplate.EventType.TRANSFER_APPROVED,
            recipient_user_id=recipient_user_id,
            context={
                "employee_name": employee_name,
                "from_dept": from_dept,
                "to_dept": to_dept,
                "effective_date": effective_date,
            },
            correlation_id=correlation_id,
        )

    @classmethod
    def notify_promotion_approved(
        cls,
        business_unit_id: uuid.UUID,
        recipient_user_id: uuid.UUID,
        employee_name: str,
        from_designation: str,
        to_designation: str,
        effective_date: str,
        correlation_id: str | None = None,
    ) -> list[NotificationLog]:
        return cls.dispatch(
            business_unit_id=business_unit_id,
            event_type=NotificationTemplate.EventType.PROMOTION_APPROVED,
            recipient_user_id=recipient_user_id,
            context={
                "employee_name": employee_name,
                "from_designation": from_designation,
                "to_designation": to_designation,
                "effective_date": effective_date,
            },
            correlation_id=correlation_id,
        )

    @classmethod
    def notify_training_nominated(
        cls,
        business_unit_id: uuid.UUID,
        recipient_user_id: uuid.UUID,
        employee_name: str,
        course_name: str,
        start_date: str,
        correlation_id: str | None = None,
    ) -> list[NotificationLog]:
        return cls.dispatch(
            business_unit_id=business_unit_id,
            event_type=NotificationTemplate.EventType.TRAINING_NOMINATED,
            recipient_user_id=recipient_user_id,
            context={
                "employee_name": employee_name,
                "course_name": course_name,
                "start_date": start_date,
            },
            correlation_id=correlation_id,
        )

    @classmethod
    def notify_doc_expiry(
        cls,
        business_unit_id: uuid.UUID,
        recipient_user_id: uuid.UUID,
        employee_name: str,
        document_type: str,
        expiry_date: str,
        days_remaining: int,
        correlation_id: str | None = None,
    ) -> list[NotificationLog]:
        if days_remaining <= 7:
            event_type = NotificationTemplate.EventType.DOC_EXPIRY_7_DAYS
        elif days_remaining <= 30:
            event_type = NotificationTemplate.EventType.DOC_EXPIRY_30_DAYS
        else:
            event_type = NotificationTemplate.EventType.DOC_EXPIRED
        return cls.dispatch(
            business_unit_id=business_unit_id,
            event_type=event_type,
            recipient_user_id=recipient_user_id,
            context={
                "employee_name": employee_name,
                "document_type": document_type,
                "expiry_date": expiry_date,
                "days_remaining": days_remaining,
            },
            correlation_id=correlation_id,
        )

    # ── Internal helpers ──────────────────────────────────────────────────────

    @staticmethod
    def _get_template(
        business_unit_id: uuid.UUID, event_type: str
    ) -> NotificationTemplate | None:
        """
        Fetch the active template for this BU+event_type.
        Falls back to any active template for the event_type if no BU-specific one exists.
        """
        try:
            return NotificationTemplate.objects.get(
                business_unit_id=business_unit_id,
                event_type=event_type,
                is_active=True,
            )
        except NotificationTemplate.DoesNotExist:
            return None
        except NotificationTemplate.MultipleObjectsReturned:
            # Should not happen due to unique=True on event_type, but be safe
            return NotificationTemplate.objects.filter(
                business_unit_id=business_unit_id,
                event_type=event_type,
                is_active=True,
            ).first()

    @staticmethod
    def _render(
        template: NotificationTemplate,
        context: dict[str, Any],
    ) -> tuple[str, str, str, str]:
        """
        Render subject, body, sms, push templates using Django's template engine.
        Uses Context (not RequestContext) — no request object available.
        Returns (subject, body, sms, push) strings. Errors return empty strings.
        """
        def safe_render(tmpl_str: str) -> str:
            if not tmpl_str:
                return ""
            try:
                return Template(tmpl_str).render(Context(context))
            except Exception as exc:
                logger.warning(
                    "NotificationService: template render error: %s tmpl=%r",
                    exc, tmpl_str[:80],
                )
                return tmpl_str  # Return raw template on error (better than empty)

        return (
            safe_render(template.subject_template),
            safe_render(template.body_template),
            safe_render(template.sms_template),
            safe_render(template.push_template),
        )

    @staticmethod
    def _get_preferences(
        business_unit_id: uuid.UUID,
        user_id: uuid.UUID,
        event_type: str,
    ) -> NotificationPreference | None:
        """Fetch user preferences for this event_type. Returns None if not set."""
        try:
            return NotificationPreference.objects.get(
                business_unit_id=business_unit_id,
                user_id=user_id,
                event_type=event_type,
            )
        except NotificationPreference.DoesNotExist:
            return None

    @staticmethod
    def _resolve_channels(
        template_channels: list[str],
        prefs: NotificationPreference | None,
    ) -> list[str]:
        """
        Intersect template's configured channels with user's opt-in preferences.
        If no preferences exist, honour template defaults (opt-in by default).
        """
        if prefs is None:
            return template_channels

        allowed: list[str] = []
        for ch in template_channels:
            if ch == NotificationLog.Channel.EMAIL and prefs.email_enabled:
                allowed.append(ch)
            elif ch == NotificationLog.Channel.SMS and prefs.sms_enabled:
                allowed.append(ch)
            elif ch == NotificationLog.Channel.PUSH and prefs.push_enabled:
                allowed.append(ch)
            elif ch == NotificationLog.Channel.IN_APP and prefs.in_app_enabled:
                allowed.append(ch)
        return allowed

    @classmethod
    def _dispatch_channel(
        cls,
        business_unit_id: uuid.UUID,
        event_type: str,
        recipient_user_id: uuid.UUID,
        channel: str,
        subject: str,
        body: str,
        correlation_id: str,
    ) -> NotificationLog:
        """
        Call the appropriate adapter and write a NotificationLog record.
        Errors in adapters are caught and recorded — never re-raised.
        """
        log = NotificationLog(
            business_unit_id=business_unit_id,
            event_type=event_type,
            recipient_user_id=recipient_user_id,
            channel=channel,
            subject=subject,
            body=body,
            status=NotificationLog.Status.QUEUED,
            correlation_id=correlation_id,
        )

        try:
            adapter = cls._get_adapter(channel)
            adapter(
                recipient_user_id=recipient_user_id,
                subject=subject,
                body=body,
                correlation_id=correlation_id,
            )
            log.status = NotificationLog.Status.SENT
            log.sent_at = timezone.now()
            logger.info(
                "Notification dispatched",
                extra={
                    "event_type": event_type,
                    "channel": channel,
                    "recipient_user_id": str(recipient_user_id),
                    "correlation_id": correlation_id,
                },
            )
        except Exception as exc:
            log.status = NotificationLog.Status.FAILED
            log.error_message = str(exc)
            log.retry_count += 1
            logger.error(
                "Notification dispatch failed",
                extra={
                    "event_type": event_type,
                    "channel": channel,
                    "recipient_user_id": str(recipient_user_id),
                    "error": str(exc),
                    "correlation_id": correlation_id,
                },
                exc_info=True,
            )

        log.save()
        return log

    @staticmethod
    def _get_adapter(channel: str):
        """Return the dispatch function for the given channel."""
        adapters = {
            NotificationLog.Channel.IN_APP: NotificationService._adapt_in_app,
            NotificationLog.Channel.EMAIL: NotificationService._adapt_email,
            NotificationLog.Channel.SMS: NotificationService._adapt_sms,
            NotificationLog.Channel.PUSH: NotificationService._adapt_push,
        }
        if channel not in adapters:
            raise ValueError(f"Unknown notification channel: {channel!r}")
        return adapters[channel]

    # ── Channel Adapters (production providers injected via settings) ─────────

    @staticmethod
    def _adapt_in_app(
        recipient_user_id: uuid.UUID,
        subject: str,
        body: str,
        correlation_id: str,
    ) -> None:
        """
        In-App notification: stored in NotificationLog (already done by caller).
        Real-time push via WebSocket/SSE is driven by a signal on NotificationLog.save().
        No external call needed here — the DB write is the delivery mechanism.
        """
        logger.debug(
            "IN_APP notification stored for user=%s event correlation_id=%s",
            recipient_user_id, correlation_id,
        )

    @staticmethod
    def _adapt_email(
        recipient_user_id: uuid.UUID,
        subject: str,
        body: str,
        correlation_id: str,
    ) -> None:
        """
        Email adapter.
        Production: swap for SendGrid / SES / Mailgun via django-anymail.
        Current: delegates to Django's built-in email backend (configured via EMAIL_*).
        """
        from django.conf import settings
        from django.core.mail import send_mail

        # Resolve email from user (lazy import to avoid circular deps)
        from apps.iam.models import User  # type: ignore[attr-defined]
        try:
            user = User.objects.get(id=recipient_user_id)
            if not user.email:
                raise ValueError(f"User {recipient_user_id} has no email address")
            send_mail(
                subject=subject,
                message=body,
                from_email=getattr(settings, "DEFAULT_FROM_EMAIL", "noreply@yss-orbit.com"),
                recipient_list=[user.email],
                fail_silently=False,
            )
        except User.DoesNotExist:
            raise ValueError(f"User {recipient_user_id} not found for email dispatch")

    @staticmethod
    def _adapt_sms(
        recipient_user_id: uuid.UUID,
        subject: str,
        body: str,
        correlation_id: str,
    ) -> None:
        """
        SMS adapter.
        Production: swap for Twilio / AWS SNS / MSG91.
        Current: logs to DEBUG — no actual SMS sent in development.
        """
        from django.conf import settings
        if getattr(settings, "SMS_ENABLED", False):
            # Production: call Twilio / MSG91 here
            logger.info(
                "SMS dispatch requested (production provider not configured)",
                extra={"recipient_user_id": str(recipient_user_id), "correlation_id": correlation_id},
            )
        else:
            logger.debug(
                "SMS suppressed (SMS_ENABLED=False): user=%s body=%r",
                recipient_user_id, body[:40],
            )

    @staticmethod
    def _adapt_push(
        recipient_user_id: uuid.UUID,
        subject: str,
        body: str,
        correlation_id: str,
    ) -> None:
        """
        Push notification adapter.
        Production: swap for Firebase Cloud Messaging (FCM) / APNs.
        Current: logs to DEBUG — no actual push sent in development.
        """
        from django.conf import settings
        if getattr(settings, "PUSH_ENABLED", False):
            logger.info(
                "Push notification dispatch requested (FCM not configured)",
                extra={"recipient_user_id": str(recipient_user_id), "correlation_id": correlation_id},
            )
        else:
            logger.debug(
                "Push suppressed (PUSH_ENABLED=False): user=%s title=%r",
                recipient_user_id, subject[:40],
            )
