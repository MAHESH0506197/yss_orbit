# yss_orbit\backend\apps\attendance\api\serializers\attendance_serializer.py
from __future__ import annotations
from rest_framework import serializers
from apps.hrms.models import AttendanceRecord, AttendancePunch

class AttendanceLogSerializer(serializers.ModelSerializer):
    punch_type_display = serializers.CharField(source="get_punch_type_display", read_only=True)

    class Meta:
        model = AttendancePunch
        fields = [
            "id", "record_id", "punch_time", "punch_type",
            "punch_type_display", "source", "ip_address", "user_agent",
            "created_at",
        ]
        read_only_fields = ["id", "created_at", "punch_type_display"]

class AttendanceRecordSerializer(serializers.ModelSerializer):
    status_display = serializers.CharField(source="get_status_display", read_only=True)
    shift_name = serializers.CharField(source="shift.name", read_only=True, allow_null=True)
    
    # Compatibility mappings
    date = serializers.DateField(source="attendance_date", read_only=True)
    check_in = serializers.DateTimeField(source="actual_in", read_only=True)
    check_out = serializers.DateTimeField(source="actual_out", read_only=True)
    working_hours = serializers.DecimalField(source="work_hours", max_digits=5, decimal_places=2, read_only=True)
    overtime_hours = serializers.SerializerMethodField()
    is_regularized = serializers.SerializerMethodField()
    regularization_reason = serializers.SerializerMethodField()
    notes = serializers.CharField(source="remarks", read_only=True)
    source = serializers.SerializerMethodField()

    class Meta:
        model = AttendanceRecord
        fields = [
            "id", "employee_id", "date", "shift", "shift_name",
            "status", "status_display", "source",
            "check_in", "check_out",
            "working_hours", "overtime_hours", "late_minutes",
            "is_regularized", "regularization_reason", "notes",
            "created_at",
        ]
        read_only_fields = [
            "id", "created_at", "status_display", "shift_name",
            "working_hours", "overtime_hours", "late_minutes",
        ]
        
    def get_overtime_hours(self, obj):
        return round(obj.overtime_minutes / 60.0, 2) if obj.overtime_minutes else 0.0

    def get_is_regularized(self, obj):
        return obj.correction_requests.filter(status='APPROVED').exists()

    def get_regularization_reason(self, obj):
        req = obj.correction_requests.filter(status='APPROVED').first()
        return req.reason if req else ""
        
    def get_source(self, obj):
        return "SYSTEM"

class RegularizeSerializer(serializers.Serializer):
    status = serializers.ChoiceField(choices=AttendanceRecord.Status.choices)
    reason = serializers.CharField(min_length=5)

class AttendanceSummarySerializer(serializers.Serializer):
    employee_id = serializers.UUIDField()
    year = serializers.IntegerField()
    month = serializers.IntegerField(min_value=1, max_value=12)
    total_days = serializers.IntegerField()
    present_days = serializers.IntegerField()
    absent_days = serializers.IntegerField()
    half_days = serializers.IntegerField()
    late_days = serializers.IntegerField()
    leave_days = serializers.IntegerField()
    total_working_hours = serializers.DecimalField(max_digits=7, decimal_places=2)
    total_overtime_hours = serializers.DecimalField(max_digits=7, decimal_places=2)