# yss_orbit\backend\apps\pqm\api\serializers\site_serializer.py
from rest_framework import serializers
from apps.pqm.models import PQMSite


class PQMSiteSerializer(serializers.ModelSerializer):
    class Meta:
        model = PQMSite
        fields = [
            "id", "organization_id", "business_unit_id", "project",
            "name", "code", "location", "address", "is_active",
            "created_at", "updated_at",
        ]
        read_only_fields = ["id", "organization_id", "business_unit_id", "created_at", "updated_at"]
