# yss_orbit\backend\apps\notification\selectors\notification_selectors.py
from apps.platform.models.notification_model import Notification
from django.db.models import QuerySet

class NotificationSelectors:
    """
    Selector logic for Notification read operations.
    """
    @staticmethod
    def get_unread_for_user(user_id: int) -> QuerySet[Notification]:
        return Notification.objects.filter(recipient_id=user_id, is_read=False).order_by('-created_at')

    @staticmethod
    def get_all_for_user(user_id: int) -> QuerySet[Notification]:
        return Notification.objects.filter(recipient_id=user_id).order_by('-created_at')
