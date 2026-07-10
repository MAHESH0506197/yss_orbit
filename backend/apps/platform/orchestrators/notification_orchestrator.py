# yss_orbit\backend\apps\notification\orchestrators\notification_orchestrator.py
from apps.platform.models.notification_model import Notification
from apps.platform.core_tasks.notification_tasks import dispatch_notification_async

class NotificationOrchestrator:
    """
    High-level orchestrator for composing, persisting, and dispatching notifications.
    """
    @staticmethod
    def trigger_notification(recipient_id: int, notification_type: str, title: str, body: str, action_url: str = None):
        # Create the DB record first
        notification = Notification.objects.create(
            recipient_id=recipient_id,
            notification_type=notification_type,
            title=title,
            body=body,
            action_url=action_url
        )
        # Queue the async dispatch
        dispatch_notification_async.delay(str(notification.id))
        return notification
