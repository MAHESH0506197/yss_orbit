# yss_orbit\backend\apps\health\api\views\liveness_view.py
from rest_framework import views, status, permissions
from rest_framework.response import Response

class LivenessProbeView(views.APIView):
    """
    Ultra-lightweight Kubernetes liveness probe.
    Does not hit the DB or Cache, just verifies the web server process is alive.
    """
    permission_classes = [permissions.AllowAny]

    def get(self, request, *args, **kwargs):
        return Response({"status": "alive"}, status=status.HTTP_200_OK)
