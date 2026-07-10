# yss_orbit\backend\apps\notification\api\views\notification_view.py
from rest_framework import viewsets, permissions
from apps.platform.models.notification_model import Notification
from apps.platform.api.serializers.notification_serializer import NotificationSerializer

class NotificationViewSet(viewsets.ModelViewSet):
    """
    Standard ViewSet for managing notifications.
    """
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Notification.objects.filter(recipient=self.request.user).order_by('-created_at')
