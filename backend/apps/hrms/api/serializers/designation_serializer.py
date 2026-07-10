# yss_orbit\backend\apps\hrms\api\serializers\designation_serializer.py
from __future__ import annotations

from rest_framework import serializers

from apps.hrms.models import Designation


class DesignationSerializer(serializers.ModelSerializer):
    department_name = serializers.CharField(source="department.name", read_only=True, allow_null=True)

    class Meta:
        model = Designation
        fields = [
            "id", "name", "code", "department", "department_name",
            "level", "description", "is_active", "created_at",
        ]
        read_only_fields = ["id", "created_at", "department_name"]
