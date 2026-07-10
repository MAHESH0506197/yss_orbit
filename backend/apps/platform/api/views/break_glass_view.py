# yss_orbit\backend\apps\platform_admin\api\views\break_glass_view.py
from rest_framework import views, status, permissions
from rest_framework.response import Response
from apps.platform.api.serializers.break_glass_serializer import BreakGlassSerializer
from apps.platform.models.break_glass_log_model import BreakGlassLog

class BreakGlassView(views.APIView):
    """
    Emergency access endpoint.
    Grants temporary access to a specific tenant and securely logs the incident.
    """
    permission_classes = [permissions.IsAdminUser]

    def post(self, request, *args, **kwargs):
        serializer = BreakGlassSerializer(data=request.data)
        if serializer.is_valid():
            BreakGlassLog.objects.create(
                admin_user=request.user,
                target_tenant_id=serializer.validated_data['target_tenant_id'],
                reason=serializer.validated_data['reason'],
                duration_minutes=serializer.validated_data['duration_minutes']
            )
            # Placeholder for granting temporary token/permissions
            return Response({"status": "granted", "message": "Emergency access logged and granted."}, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
