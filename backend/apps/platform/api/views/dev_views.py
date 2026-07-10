from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from apps.platform.models import WebhookEndpoint, WebhookDelivery
from ..serializers.dev_serializers import WebhookEndpointSerializer, WebhookDeliverySerializer

class WebhookEndpointViewSet(viewsets.ModelViewSet):
    queryset = WebhookEndpoint.objects.all()
    serializer_class = WebhookEndpointSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['status', 'business_unit_id']
    search_fields = ['url', 'description']
    ordering_fields = ['created_at']
    ordering = ['-created_at']

class WebhookDeliveryViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = WebhookDelivery.objects.all()
    serializer_class = WebhookDeliverySerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['status', 'endpoint', 'event_type', 'business_unit_id']
    search_fields = ['event_id']
    ordering_fields = ['created_at']
    ordering = ['-created_at']
