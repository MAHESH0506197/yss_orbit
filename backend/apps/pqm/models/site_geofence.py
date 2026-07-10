# yss_orbit\backend\apps\pqm\models\site_geofence.py
"""
PQMSiteGeofence — circular geofence boundary for a site.
Used to flag whether photo attachments were captured within site bounds.
Geofence violations are informational only — they never block NC submission.
"""
from __future__ import annotations

from django.db import models

from apps.platform.models.base import TenantModel


class PQMSiteGeofence(TenantModel):
    """
    Circular geofence configuration for a PQM site.
    One-to-one with PQMSite. A site may or may not have a geofence.
    """

    organization_id = models.UUIDField(
        null=False,
        help_text="Denormalized from BU for tenant isolation.",
    )
    site = models.OneToOneField(
        "pqm.PQMSite",
        on_delete=models.PROTECT,
        related_name="geofence",
    )
    center_lat = models.DecimalField(
        max_digits=10,
        decimal_places=7,
        help_text="Latitude of geofence center.",
    )
    center_lng = models.DecimalField(
        max_digits=10,
        decimal_places=7,
        help_text="Longitude of geofence center.",
    )
    radius_meters = models.PositiveIntegerField(
        default=500,
        help_text="Radius of geofence circle in meters.",
    )

    class Meta(TenantModel.Meta):
        db_table = "pqm_site_geofence"

    def __str__(self) -> str:
        return f"Geofence for {self.site_id} (r={self.radius_meters}m)"
