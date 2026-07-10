# yss_orbit\backend\apps\notification\api\views\notification_preference_view.py
from rest_framework import generics, permissions
from apps.platform.models.notification_preference_model import NotificationPreference
from apps.platform.api.serializers.notification_serializer import NotificationPreferenceSerializer

class NotificationPreferenceView(generics.RetrieveUpdateAPIView):
    """
    Retrieves or updates the authenticated user's notification preferences.
    """
    serializer_class = NotificationPreferenceSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        obj, created = NotificationPreference.objects.get_or_create(user=self.request.user)
        return obj
