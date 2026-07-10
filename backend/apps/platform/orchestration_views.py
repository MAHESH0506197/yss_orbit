# yss_orbit\backend\apps\orchestration\views.py
from rest_framework import viewsets, mixins
from apps.platform.models import Saga
from apps.platform.serializers import SagaSerializer

class SagaViewSet(mixins.ListModelMixin, mixins.RetrieveModelMixin, viewsets.GenericViewSet):
    """
    Read-only viewset to inspect Saga states and their steps.
    """
    queryset = Saga.objects.all().prefetch_related("steps")
    serializer_class = SagaSerializer
    filterset_fields = ["saga_type", "status", "correlation_id", "business_unit_id"]
    ordering_fields = ["created_at", "updated_at"]
    ordering = ["-created_at"]
