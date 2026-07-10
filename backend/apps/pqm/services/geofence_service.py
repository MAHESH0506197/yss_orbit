# yss_orbit\backend\apps\pqm\services\geofence_service.py
"""GPS/geofence validation for photo attachments. Always flags, never blocks."""
from __future__ import annotations

import math


class GeofenceService:

    @staticmethod
    def validate_photo_location(attachment: object) -> bool:
        """
        Compare attachment GPS against site geofence.
        Sets attachment.gps_within_geofence flag.
        Never raises — flag only. Returns True if within fence.
        """
        lat = getattr(attachment, "photo_gps_lat", None)
        lng = getattr(attachment, "photo_gps_lng", None)

        if lat is None or lng is None:
            return True  # No GPS data — skip check

        try:
            nc = attachment.nc
            site = nc.site
            geofence = site.geofence  # type: ignore[attr-defined]
        except Exception:
            attachment.gps_within_geofence = None
            return True

        distance_m = GeofenceService._haversine_distance(
            float(lat), float(lng),
            float(geofence.center_lat), float(geofence.center_lng),
        )
        within = distance_m <= geofence.radius_meters
        attachment.gps_within_geofence = within

        try:
            attachment.save(update_fields=["gps_within_geofence"])
        except Exception:
            pass  # non-fatal

        return within

    @staticmethod
    def _haversine_distance(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
        """Return distance in metres between two GPS coordinates."""
        R = 6_371_000  # Earth radius in metres
        phi1, phi2 = math.radians(lat1), math.radians(lat2)
        dphi = math.radians(lat2 - lat1)
        dlambda = math.radians(lng2 - lng1)
        a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2) ** 2
        return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
