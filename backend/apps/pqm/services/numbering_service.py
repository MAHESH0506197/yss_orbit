# yss_orbit\backend\apps\pqm\services\numbering_service.py
"""
Atomic NC number generation with select_for_update to prevent race conditions.
Produces unique numbers like: NC-2025-L-00001 (Live) or NC-2025-LG-00001 (Legacy).
"""
from __future__ import annotations

from django.db import transaction
from django.utils import timezone

from apps.pqm.enums import NCSeries


class NumberingService:

    @staticmethod
    def generate_nc_number(
        project,
        series: str = NCSeries.LIVE,
    ) -> str:
        """
        Thread-safe NC number generation via DB-level row locking.
        Must be called inside a transaction block (or starts its own).
        """
        from apps.pqm.models.sequence_counter import PQMSequenceCounter

        year = timezone.now().year
        series_prefix = "LG" if series == NCSeries.LEGACY else ""

        with transaction.atomic():
            counter, _ = PQMSequenceCounter.objects.select_for_update().get_or_create(
                organization_id=project.organization_id,
                project_id=project.id,
                year=year,
                series=series,
                defaults={"last_value": 0},
            )
            counter.last_value += 1
            counter.save(update_fields=["last_value"])
            seq = counter.last_value

        proj_code = project.code or "PRJ"
        # e.g. PRJ-PAV_NC_00001 or PRJ-PAV_NC_LG00001
        return f"{proj_code}_NC_{series_prefix}{seq:05d}"
