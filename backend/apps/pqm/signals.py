# yss_orbit\backend\apps\pqm\signals.py
"""
PQM Django signals.
- pre_save: capture old NC status for post_save comparison
- post_save NonConformance: auto-trigger geofence check on attachment GPS
- post_save PQMAttachment: call GeofenceService
"""
from __future__ import annotations

from django.db.models.signals import pre_save, post_save
from django.dispatch import receiver


# ---------------------------------------------------------------------------
# NonConformance — capture old status before save
# ---------------------------------------------------------------------------
@receiver(pre_save, sender="pqm.NonConformance")
def nc_capture_old_status(sender, instance, **kwargs):
    """Store the DB status on the instance so post_save can detect changes."""
    if instance.pk:
        try:
            instance._pre_save_status = (
                sender.objects.filter(pk=instance.pk)
                .values_list("status", flat=True)
                .first()
            )
        except Exception:
            instance._pre_save_status = None
    else:
        instance._pre_save_status = None


# ---------------------------------------------------------------------------
# PQMAttachment — GPS geofence validation after save
# ---------------------------------------------------------------------------
@receiver(post_save, sender="pqm.PQMAttachment")
def attachment_geofence_check(sender, instance, created, **kwargs):
    """
    On new attachment upload, asynchronously validate GPS location.
    update_fields guard prevents infinite re-save loop.
    """
    if not created:
        return
    has_gps = (
        getattr(instance, "photo_gps_lat", None) is not None
        and getattr(instance, "photo_gps_lng", None) is not None
    )
    if not has_gps:
        return
    if getattr(instance, "gps_within_geofence", None) is not None:
        return  # already set

    try:
        from apps.pqm.services.geofence_service import GeofenceService
        GeofenceService.validate_photo_location(instance)
    except Exception:
        pass  # non-fatal
