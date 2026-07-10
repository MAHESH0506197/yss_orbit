# yss_orbit\backend\apps\events\views.py
from rest_framework import viewsets, mixins, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from apps.platform.models import EventOutbox, EventDeadLetter, ProcessedEvent
from apps.platform.serializers import EventOutboxSerializer, EventDeadLetterSerializer, ProcessedEventSerializer

class EventOutboxViewSet(mixins.ListModelMixin, mixins.RetrieveModelMixin, viewsets.GenericViewSet):
    queryset = EventOutbox.objects.all()
    serializer_class = EventOutboxSerializer
    filterset_fields = ["event_type", "status", "business_unit_id", "correlation_id"]
    ordering_fields = ["created_at"]
    ordering = ["-created_at"]


class EventDeadLetterViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = EventDeadLetter.objects.all()
    serializer_class = EventDeadLetterSerializer
    filterset_fields = ["event_type", "resolved", "business_unit_id", "correlation_id"]
    ordering_fields = ["created_at", "resolved_at"]
    ordering = ["-created_at"]

    @action(detail=True, methods=["post"])
    def retry(self, request, pk=None):
        """
        Retry a dead letter event by putting it back into the outbox.
        """
        dead_letter = self.get_object()
        if dead_letter.resolved:
            return Response({"detail": "Already resolved."}, status=status.HTTP_400_BAD_REQUEST)
        
        # Re-queue into outbox
        EventOutbox.objects.create(
            event_id=dead_letter.original_event_id,
            event_type=dead_letter.event_type,
            business_unit_id=dead_letter.business_unit_id,
            correlation_id=dead_letter.correlation_id,
            payload=dead_letter.payload,
            status="PENDING",
            next_retry_at=timezone.now()
        )
        
        dead_letter.resolved = True
        dead_letter.resolved_at = timezone.now()
        dead_letter.resolution_notes = "Manually requeued via API"
        dead_letter.save(update_fields=["resolved", "resolved_at", "resolution_notes"])
        
        return Response({"detail": "Event requeued successfully."})

class ProcessedEventViewSet(mixins.ListModelMixin, mixins.RetrieveModelMixin, viewsets.GenericViewSet):
    queryset = ProcessedEvent.objects.all()
    serializer_class = ProcessedEventSerializer
    filterset_fields = ["event_type", "consumer", "business_unit_id"]
    ordering_fields = ["processed_at"]
    ordering = ["-processed_at"]
