from rest_framework.views import APIView
from rest_framework.request import Request
from rest_framework.response import Response

from apps.platform.core_permissions import IsAuthenticated, IsSuperAdmin
from apps.platform.core_response import success_response
from apps.platform.services.dashboard_service import DashboardService

class PlatformDashboardView(APIView):
    """
    Platform Super Admin Dashboard
    Accessible ONLY to users with is_superuser=True.
    """
    permission_classes = [IsAuthenticated, IsSuperAdmin]

    def get(self, request: Request) -> Response:
        metrics = DashboardService.get_platform_metrics()
        return success_response(data=metrics, request=request)
