# yss_orbit\backend\apps\pqm\api\serializers\contractor_serializer.py
from rest_framework import serializers
from apps.pqm.models import PQMContractor


class PQMContractorSerializer(serializers.ModelSerializer):
    class Meta:
        model = PQMContractor
        fields = [
            "id", "organization_id", "business_unit_id",
            "name", "contact_person", "contact_email", "contact_phone", "is_active",
        ]
        read_only_fields = ["id", "organization_id", "business_unit_id"]
