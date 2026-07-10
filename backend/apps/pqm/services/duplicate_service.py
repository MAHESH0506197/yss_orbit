# yss_orbit\backend\apps\pqm\services\duplicate_service.py
"""Duplicate NC detection and merge logic."""
from __future__ import annotations

import uuid
from datetime import timedelta

from django.db import transaction
from django.utils import timezone

from apps.pqm.enums import NCStatus


class DuplicateService:

    @staticmethod
    def find_similar_ncs(nc: object):
        """
        Soft duplicate check: same site + same category + within 48-hour window.
        Returns a QuerySet — caller decides whether to warn the user.
        """
        from apps.pqm.models import NonConformance

        window_start = (nc.created_at or timezone.now()) - timedelta(hours=48)
        window_end = (nc.created_at or timezone.now()) + timedelta(hours=48)

        qs = NonConformance.objects.filter(
            site_id=nc.site_id,
            category_id=nc.category_id,
            created_at__range=(window_start, window_end),
            is_deleted=False,
        ).exclude(
            id=nc.id,
        ).exclude(
            status__in=[NCStatus.MERGED, NCStatus.CLOSED],
        )

        if nc.location_description:
            # Narrow further by overlapping location text (substring match)
            qs = qs.filter(location_description__icontains=nc.location_description[:30])

        return qs

    @staticmethod
    def merge_nc(
        source_nc: object,
        target_nc: object,
        actor_id: uuid.UUID,
    ) -> object:
        """
        Merge source_nc into target_nc.
        - All attachments and comments from source are reassigned to target.
        - Source becomes MERGED (terminal, read-only).
        - History is preserved on both NCs.
        """
        from apps.pqm.models.attachment import PQMAttachment
        from apps.pqm.models.comment import PQMComment
        from apps.pqm.models.status_history import PQMStatusHistory
        from apps.pqm.services.nc_service import NCService
        from apps.pqm.services.notification_service import NotificationService

        with transaction.atomic():
            # Reassign child records to target
            PQMAttachment.objects.filter(nc=source_nc, is_deleted=False).update(nc=target_nc)
            PQMComment.objects.filter(nc=source_nc, is_deleted=False).update(nc=target_nc)

            # Write history on source
            PQMStatusHistory.objects.create(
                organization_id=source_nc.organization_id,
                business_unit_id=source_nc.business_unit_id,
                nc=source_nc,
                event_type="Merged",
                from_status=source_nc.status,
                to_status=NCStatus.MERGED,
                actor_id=actor_id,
                metadata={"merged_into_nc_id": str(target_nc.id), "merged_into_nc_number": target_nc.nc_number},
            )

            # Set merge FK and transition source
            source_nc.merged_into_nc = target_nc
            source_nc.save(update_fields=["merged_into_nc_id", "updated_at", "updated_by_id"])
            NCService.transition_status(source_nc, NCStatus.MERGED, actor_id, reason="Merged into NC")

        NotificationService.send_nc_event(source_nc, "nc_merged")
        return target_nc
