# yss_orbit\backend\apps\observability\api\views\observability_detail_view.py
from rest_framework import generics, permissions
from apps.observability.models.observability_model import RequestTrace
from apps.observability.api.serializers.observability_serializer import RequestTraceSerializer

class ObservabilityDetailView(generics.RetrieveAPIView):
    serializer_class = RequestTraceSerializer
    permission_classes = [permissions.IsAdminUser]

    def get_queryset(self):
        return RequestTrace.objects.all()
