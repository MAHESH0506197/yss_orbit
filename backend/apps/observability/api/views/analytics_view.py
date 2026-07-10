# yss_orbit\backend\apps\reporting\api\views\analytics_view.py
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from apps.observability.services.analytics_service import AnalyticsService

class AnalyticsAggregationView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        days = int(request.query_params.get('days', 30))
        service = AnalyticsService(user=request.user)
        stats = service.get_user_activity_stats(days)
        return Response({"status": "success", "data": stats})
