# yss_orbit\backend\apps\observability\api\views\observability_view.py
from rest_framework import viewsets, permissions
from apps.observability.models.observability_model import RequestTrace
from apps.observability.api.serializers.observability_serializer import RequestTraceSerializer

class ObservabilityViewSet(viewsets.ModelViewSet):
    """
    Standard ViewSet for full CRUD on Traces if needed for testing/admin.
    """
    serializer_class = RequestTraceSerializer
    permission_classes = [permissions.IsAdminUser]

    def get_queryset(self):
        return RequestTrace.objects.all()
