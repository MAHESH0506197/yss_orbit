from rest_framework import serializers
from apps.payroll.models import ProfessionalTaxSlab

class ProfessionalTaxSlabSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProfessionalTaxSlab
        fields = [
            'id', 'state_code', 'financial_year', 'salary_from', 'salary_to',
            'monthly_pt_amount', 'is_active', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']
