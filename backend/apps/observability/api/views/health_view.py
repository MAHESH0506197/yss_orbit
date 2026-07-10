# yss_orbit\backend\apps\health\api\views\health_view.py
from rest_framework import views, status, permissions
from rest_framework.response import Response
from apps.observability.services.health_service import HealthService
from apps.observability.api.serializers.health_response_serializer import SystemStatusResponseSerializer

class HealthCheckView(views.APIView):
    """
    Comprehensive system health check view, checking DB, cache, and queue.
    """
    permission_classes = [permissions.AllowAny]

    def get(self, request, *args, **kwargs):
        health_data = HealthService.get_comprehensive_status()
        
        serializer = SystemStatusResponseSerializer(health_data)
        
        http_status = status.HTTP_200_OK if health_data['status'] == 'healthy' else status.HTTP_503_SERVICE_UNAVAILABLE
        
        return Response(serializer.data, status=http_status)
