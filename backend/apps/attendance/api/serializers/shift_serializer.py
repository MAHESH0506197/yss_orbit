# yss_orbit\backend\apps\attendance\api\serializers\shift_serializer.py
from __future__ import annotations
from rest_framework import serializers
from apps.hrms.models import Shift

class ShiftSerializer(serializers.ModelSerializer):
    class Meta:
        model = Shift
        fields = [
            "id", "name", "code", "start_time", "end_time",
            "grace_minutes", "overtime_after_minutes", "is_night_shift",
            "is_active", "created_at",
        ]
        read_only_fields = ["id", "created_at"]
