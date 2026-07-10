# yss_orbit\backend\apps\platform_admin\api\views\platform_stats_view.py
from rest_framework import views, status, permissions
from rest_framework.response import Response
from apps.organization.models.organization_model import Organization

class PlatformStatsView(views.APIView):
    """
    High level aggregated stats for the super-admin dashboard.
    """
    permission_classes = [permissions.IsAdminUser]

    def get(self, request, *args, **kwargs):
        # Mock aggregation
        total_orgs = Organization.objects.count()
        active_orgs = Organization.objects.filter(is_active=True).count()
        
        return Response({
            "total_organizations": total_orgs,
            "active_organizations": active_orgs,
            "total_mrr": "$45,200",
            "active_users": 1542
        }, status=status.HTTP_200_OK)
