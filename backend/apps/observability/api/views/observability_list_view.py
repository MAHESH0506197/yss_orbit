# yss_orbit\backend\apps\observability\api\views\observability_list_view.py
from rest_framework import generics, permissions
from apps.observability.models.observability_model import RequestTrace
from apps.observability.api.serializers.observability_serializer import RequestTraceSerializer

class ObservabilityListView(generics.ListAPIView):
    serializer_class = RequestTraceSerializer
    permission_classes = [permissions.IsAdminUser]

    def get_queryset(self):
        return RequestTrace.objects.all().order_by('-timestamp')
