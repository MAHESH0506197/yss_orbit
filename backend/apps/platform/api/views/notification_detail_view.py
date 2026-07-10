# yss_orbit\backend\apps\notification\api\views\notification_detail_view.py
from rest_framework import generics, permissions
from apps.platform.models.notification_model import Notification
from apps.platform.api.serializers.notification_serializer import NotificationSerializer

class NotificationDetailView(generics.RetrieveUpdateAPIView):
    """
    Retrieves or updates a specific notification (e.g., marking it as read).
    """
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Notification.objects.filter(recipient=self.request.user)
