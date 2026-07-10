# yss_orbit\backend\apps\reporting\services\analytics_service.py
import logging
from django.db import transaction
from django.db.models import Count
from django.utils import timezone
from datetime import timedelta
from apps.compliance.models import AuditLog

logger = logging.getLogger(__name__)

class AnalyticsService:
    def __init__(self, user=None):
        self.user = user

    def get_user_activity_stats(self, days=30):
        logger.info(f"Aggregating user activity for the last {days} days")
        start_date = timezone.now() - timedelta(days=days)
        stats = AuditLog.objects.filter(timestamp__gte=start_date).values('action').annotate(
            count=Count('id')
        ).order_by('-count')
        return list(stats)

    @transaction.atomic
    def process(self, data: dict):
        logger.info(f"AnalyticsService processing data: {data}")
        days = data.get('days', 30)
        stats = self.get_user_activity_stats(days)
        return {"status": "processed", "data": stats}
