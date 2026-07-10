# yss_orbit\backend\apps\domain\api\views\domain_view.py
from rest_framework import viewsets, permissions
from apps.tenancy.models.domain_model import Domain
from apps.tenancy.api.serializers.domain_serializer import DomainSerializer

class DomainViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Tenant-facing viewset for Domains. Read-only.
    """
    serializer_class = DomainSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        if hasattr(self.request, "security_context") and self.request.security_context:
            bu_id = self.request.security_context.effective_business_unit_id
            if bu_id:
                return Domain.objects.filter(business_unit_id=bu_id)
        return Domain.objects.none()
