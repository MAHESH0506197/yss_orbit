# yss_orbit\backend\apps\observability\api\views\trace_view.py
from rest_framework import generics, permissions
from apps.observability.models.observability_model import RequestTrace
from apps.observability.api.serializers.observability_serializer import RequestTraceSerializer

class TraceView(generics.ListAPIView):
    """
    API view to query HTTP traces for performance debugging.
    """
    serializer_class = RequestTraceSerializer
    permission_classes = [permissions.IsAdminUser]

    def get_queryset(self):
        return RequestTrace.objects.all().order_by('-timestamp')
