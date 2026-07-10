# yss_orbit\backend\apps\domain\api\views\domain_list_view.py
from rest_framework import generics, permissions
from apps.tenancy.models.domain_model import Domain
from apps.tenancy.api.serializers.domain_serializer import DomainSerializer

class DomainListView(generics.ListCreateAPIView):
    """
    API view to retrieve list of domains or create a new one.
    """
    serializer_class = DomainSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Filter by tenant/business_unit if using TenantModel properly
        # For now, rely on TenantMiddleware and TenantModel global filtering
        return Domain.objects.all()
