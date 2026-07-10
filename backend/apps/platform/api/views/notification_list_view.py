# yss_orbit\backend\apps\notification\api\views\notification_list_view.py
from rest_framework import generics, permissions
from apps.platform.models.notification_model import Notification
from apps.platform.api.serializers.notification_serializer import NotificationSerializer

class NotificationListView(generics.ListAPIView):
    """
    Retrieves the list of notifications for the authenticated user.
    """
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Notification.objects.filter(recipient=self.request.user).order_by('-created_at')
