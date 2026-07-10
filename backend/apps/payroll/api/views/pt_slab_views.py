from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated

from apps.payroll.models import ProfessionalTaxSlab
from apps.payroll.api.serializers.pt_slab_serializer import ProfessionalTaxSlabSerializer
from apps.hrms.api.views.utils import _get_bu_id
from rest_framework.exceptions import ValidationError


class ProfessionalTaxSlabViewSet(viewsets.ModelViewSet):
    """
    CRUD for Professional Tax Slabs per Business Unit.
    """
    queryset = ProfessionalTaxSlab.objects.all()
    serializer_class = ProfessionalTaxSlabSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        bu_id = _get_bu_id(self.request)
        if not bu_id:
            return self.queryset.none()
        return self.queryset.filter(business_unit_id=bu_id, is_active=True)

    def perform_create(self, serializer):
        bu_id = _get_bu_id(self.request)
        if not bu_id:
            raise ValidationError({"business_unit_id": "X-Business-Unit-ID header is required."})
        serializer.save(business_unit_id=bu_id)
