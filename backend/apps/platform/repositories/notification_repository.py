# yss_orbit\backend\apps\notification\repositories\notification_repository.py
from apps.platform.models.notification_model import Notification

class NotificationRepository:
    """
    Data Access Layer for Notification entity.
    """
    @staticmethod
    def mark_as_read(notification_id: str) -> Notification:
        notification = Notification.objects.get(id=notification_id)
        if not notification.is_read:
            from django.utils import timezone
            notification.is_read = True
            notification.read_at = timezone.now()
            notification.save()
        return notification
