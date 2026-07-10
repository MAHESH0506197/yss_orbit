# yss_orbit\backend\apps\outbox\api\views\outbox_view.py
from rest_framework import viewsets, mixins
from apps.platform.models import OutboxMessage, OutboxDeadLetter
from apps.platform.api.serializers.outbox_serializer import OutboxMessageSerializer, OutboxDeadLetterSerializer

class OutboxMessageViewSet(mixins.ListModelMixin, mixins.RetrieveModelMixin, viewsets.GenericViewSet):
    queryset = OutboxMessage.objects.all()
    serializer_class = OutboxMessageSerializer
    filterset_fields = ["message_type", "status", "destination"]
    ordering_fields = ["created_at"]
    ordering = ["-created_at"]

class OutboxDeadLetterViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = OutboxDeadLetter.objects.all()
    serializer_class = OutboxDeadLetterSerializer
    filterset_fields = ["message_type", "resolved"]
    ordering_fields = ["created_at"]
    ordering = ["-created_at"]
