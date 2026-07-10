from rest_framework import viewsets, mixins, status
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated

from apps.compliance.models import ConsentRecord, DataSubjectRequest
from apps.compliance.api.serializers import ConsentRecordSerializer, DataSubjectRequestSerializer
from apps.compliance.services.anonymization import DataErasureService

class ConsentRecordViewSet(mixins.CreateModelMixin, mixins.ListModelMixin, viewsets.GenericViewSet):
    """
    API endpoint that allows users to manage their consent records.
    """
    serializer_class = ConsentRecordSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # Users can only view their own consent records
        return ConsentRecord.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=True, methods=['post'])
    def withdraw(self, request, pk=None):
        """
        Endpoint to withdraw a specific consent.
        """
        consent = self.get_object()
        if not consent.is_granted:
            return Response(
                {"detail": "Consent is already withdrawn."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        consent.withdraw()
        return Response({"detail": "Consent successfully withdrawn."})


class DataSubjectRequestViewSet(mixins.CreateModelMixin, mixins.ListModelMixin, viewsets.GenericViewSet):
    """
    API endpoint for Data Subject Requests (Right to Erasure, Export, etc.).
    """
    serializer_class = DataSubjectRequestSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # Users can only view their own requests
        return DataSubjectRequest.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        dsr = serializer.save(user=self.request.user)
        
        # If it's an erasure request, we might want to process it asynchronously
        # For this implementation, we will trigger it if conditions are met
        # or it could be queued for an admin to review first.
        # As a basic production-ready implementation, we queue it as pending.
        # But for demonstration/automation, we can call the service right away
        # if the policy allows immediate self-service erasure.
        
        # Uncomment below if immediate processing is desired
        # if dsr.request_type == 'erasure':
        #     DataErasureService.process_erasure_request(dsr.id)

