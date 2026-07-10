# yss_orbit\backend\apps\health\selectors\health_selectors.py
from apps.observability.models.health_model import SystemHealthLog
from django.db.models import QuerySet
from django.utils import timezone
from datetime import timedelta

class HealthSelectors:
    """
    Selector logic for SystemHealthLog.
    """
    @staticmethod
    def get_recent_failures(hours: int = 24) -> QuerySet[SystemHealthLog]:
        cutoff = timezone.now() - timedelta(hours=hours)
        return SystemHealthLog.objects.filter(checked_at__gte=cutoff).exclude(status='healthy')

    @staticmethod
    def get_latest_log() -> SystemHealthLog | None:
        return SystemHealthLog.objects.first()
