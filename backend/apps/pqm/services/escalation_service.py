# yss_orbit\backend\apps\pqm\services\escalation_service.py
"""Celery task body for overdue NC escalation ladder."""
from __future__ import annotations

import logging
from datetime import date

logger = logging.getLogger(__name__)


class EscalationService:

    @staticmethod
    def check_overdue_ncs() -> int:
        """
        Find all overdue NCs and fire escalation notifications per tenant config.
        Called from Celery beat task daily.
        Returns count of NCs processed.
        """
        from apps.pqm.models import NonConformance, PQMEscalationConfig
        from apps.pqm.enums import NCStatus
        from apps.pqm.services.notification_service import NotificationService

        today = date.today()
        overdue_ncs = NonConformance.objects.filter(
            target_closure_date__lt=today,
            is_deleted=False,
        ).exclude(
            status__in=[NCStatus.CLOSED, NCStatus.MERGED, NCStatus.REJECTED],
        ).select_related("site", "project")

        processed = 0
        for nc in overdue_ncs:
            try:
                days_overdue = (today - nc.target_closure_date).days
                config = None
                try:
                    priority_str = nc.priority.system_mapping or nc.priority.name if nc.priority else Priority.MEDIUM
                    config = PQMEscalationConfig.objects.get(
                        organization_id=nc.organization_id,
                        business_unit_id=nc.business_unit_id,
                        priority=priority_str,
                    )
                except PQMEscalationConfig.DoesNotExist:
                    pass

                extra_recipients = []
                if config:
                    if config.escalation_day_3 and days_overdue >= config.escalation_day_3:
                        logger.warning("NC %s escalation tier 3, %d days overdue", nc.nc_number, days_overdue)
                    elif config.escalation_day_2 and days_overdue >= config.escalation_day_2:
                        logger.warning("NC %s escalation tier 2, %d days overdue", nc.nc_number, days_overdue)
                    elif config.escalation_day_1 and days_overdue >= config.escalation_day_1:
                        logger.info("NC %s escalation tier 1, %d days overdue", nc.nc_number, days_overdue)

                NotificationService.send_nc_event(
                    nc, "nc_overdue_escalation", extra_recipient_ids=extra_recipients
                )
                processed += 1
            except Exception as exc:
                logger.error("Escalation check failed for NC %s: %s", getattr(nc, "id", "?"), exc)

        return processed

    @staticmethod
    def check_due_approaching() -> int:
        """Send T-1 day reminders to assigned engineers."""
        from datetime import timedelta
        from apps.pqm.models import NonConformance
        from apps.pqm.enums import NCStatus
        from apps.pqm.services.notification_service import NotificationService

        tomorrow = date.today() + timedelta(days=1)
        approaching = NonConformance.objects.filter(
            target_closure_date=tomorrow,
            assigned_to_id__isnull=False,
            is_deleted=False,
        ).exclude(
            status__in=[NCStatus.CLOSED, NCStatus.MERGED, NCStatus.REJECTED],
        )

        processed = 0
        for nc in approaching:
            try:
                NotificationService.send_nc_event(nc, "nc_due_approaching")
                processed += 1
            except Exception as exc:
                logger.error("Due-approaching check failed for NC %s: %s", nc.id, exc)

        return processed
