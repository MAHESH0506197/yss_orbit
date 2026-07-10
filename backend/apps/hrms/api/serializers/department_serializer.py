# yss_orbit\backend\apps\hrms\api\serializers\department_serializer.py
from __future__ import annotations

from rest_framework import serializers

from apps.hrms.models import Department


class DepartmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Department
        fields = [
            "id", "name", "code", "description",
            "parent", "head_employee_id",
            "is_active", "created_at",
        ]
        read_only_fields = ["id", "created_at"]
