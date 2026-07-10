# yss_orbit\backend\apps\pqm\models\sequence_counter.py
"""
PQMSequenceCounter — atomic NC number sequence counter.

NOT a TenantModel (no soft-delete, no audit columns needed).
Uses select_for_update() in NumberingService for race-condition-safe incrementing.
One row per (organization, year, series) — reset per calendar year.
"""
from __future__ import annotations

from django.db import models

from apps.pqm.enums import NCSeries


class PQMSequenceCounter(models.Model):
    """
    Atomic sequence counter for NC number generation.

    NumberingService.generate_nc_number() uses:
        PQMSequenceCounter.objects.select_for_update().get_or_create(...)
    to ensure no duplicate NC numbers across concurrent requests.

    last_value: the highest number issued so far (0 = none issued yet).
    """

    organization_id = models.UUIDField(
        db_index=True,
        help_text="Organization scope for the sequence.",
    )
    project_id = models.UUIDField(
        db_index=True,
        help_text="Project scope for the sequence.",
    )
    year = models.PositiveSmallIntegerField(
        help_text="Calendar year for this counter (resets annually).",
    )
    series = models.CharField(
        max_length=10,
        choices=NCSeries.choices,
        help_text="LIVE or LEGACY series.",
    )
    last_value = models.PositiveBigIntegerField(
        default=0,
        help_text="Highest sequence number issued. Incremented atomically.",
    )

    class Meta:
        db_table = "pqm_sequence_counter"
        unique_together = [("organization_id", "project_id", "year", "series")]

    def __str__(self) -> str:
        return f"Counter [{self.organization_id}] Proj [{self.project_id}] {self.year}/{self.series} = {self.last_value}"
