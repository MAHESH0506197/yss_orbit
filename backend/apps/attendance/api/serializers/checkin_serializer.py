# yss_orbit\backend\apps\attendance\api\serializers\checkin_serializer.py
from __future__ import annotations
from rest_framework import serializers
from apps.hrms.models import AttendanceRecord, AttendancePunch

class CheckInSerializer(serializers.Serializer):
    employee_id = serializers.UUIDField()
    location = serializers.JSONField(required=False, allow_null=True, default=None)
    device_id = serializers.CharField(required=False, default="")
    source = serializers.ChoiceField(
        choices=AttendancePunch.Source.choices,
        default=AttendancePunch.Source.MOBILE,
    )

class CheckOutSerializer(serializers.Serializer):
    employee_id = serializers.UUIDField()
    location = serializers.JSONField(required=False, allow_null=True, default=None)
    device_id = serializers.CharField(required=False, default="")
