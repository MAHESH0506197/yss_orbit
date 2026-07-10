# yss_orbit\backend\apps\health\api\views\readiness_view.py
from rest_framework import views, status, permissions
from rest_framework.response import Response
from apps.observability.services.health_service import HealthService

class ReadinessProbeView(views.APIView):
    """
    Kubernetes readiness probe.
    Checks if the application is fully ready to receive traffic (e.g., DB connections are valid).
    """
    permission_classes = [permissions.AllowAny]

    def get(self, request, *args, **kwargs):
        is_ready = HealthService.check_database() and HealthService.check_cache()
        if is_ready:
            return Response({"status": "ready"}, status=status.HTTP_200_OK)
        return Response({"status": "not_ready"}, status=status.HTTP_503_SERVICE_UNAVAILABLE)
