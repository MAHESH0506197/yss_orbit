# yss_orbit\backend\apps\domain\api\views\domain_detail_view.py
from rest_framework import generics, permissions
from apps.tenancy.models.domain_model import Domain
from apps.tenancy.api.serializers.domain_serializer import DomainSerializer

class DomainDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    API view to retrieve, update or delete a specific domain.
    """
    serializer_class = DomainSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Domain.objects.all()
