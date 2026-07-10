# yss_orbit\backend\apps\platform_admin\api\views\platform_admin_detail_view.py
from rest_framework import generics, permissions
from apps.platform.models.platform_admin_model import PlatformAdminProfile
from apps.platform.api.serializers.platform_admin_serializer import PlatformAdminProfileSerializer

class PlatformAdminDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    Manage a specific platform admin.
    """
    serializer_class = PlatformAdminProfileSerializer
    permission_classes = [permissions.IsAdminUser]

    def get_queryset(self):
        return PlatformAdminProfile.objects.all()
