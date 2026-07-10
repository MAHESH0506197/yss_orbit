# yss_orbit\backend\apps\pqm\api\serializers\project_serializer.py
from rest_framework import serializers
from apps.pqm.models import PQMProject


class PQMProjectSerializer(serializers.ModelSerializer):
    class Meta:
        model = PQMProject
        fields = [
            "id", "organization_id", "business_unit_id",
            "name", "code", "description", "location",
            "project_start_date", "expected_project_end_date",
            "capacity", "construction_incharge_id", "quality_incharge_id",
            "project_head_id", "quality_head_id",
            "is_active", "is_deleted", "created_at", "updated_at",
        ]
        read_only_fields = ["id", "organization_id", "business_unit_id", "is_deleted", "created_at", "updated_at"]
