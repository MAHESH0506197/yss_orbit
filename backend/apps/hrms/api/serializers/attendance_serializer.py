from rest_framework import serializers
from apps.hrms.models import AttendanceRecord, AttendancePunch, Shift

class ShiftSerializer(serializers.ModelSerializer):
    class Meta:
        model = Shift
        fields = ['id', 'name', 'start_time', 'end_time', 'grace_time_minutes']

class AttendancePunchSerializer(serializers.ModelSerializer):
    class Meta:
        model = AttendancePunch
        fields = ['id', 'punch_time', 'punch_type', 'source', 'ip_address', 'user_agent']

class AttendanceCorrectionBriefSerializer(serializers.ModelSerializer):
    requested_by_name = serializers.CharField(source='employee.full_name', read_only=True)
    approved_by_name = serializers.CharField(source='approved_by.full_name', read_only=True)
    class Meta:
        from apps.hrms.models import AttendanceCorrectionRequest
        model = AttendanceCorrectionRequest
        fields = ['id', 'status', 'reason', 'requested_in_time', 'requested_out_time', 'created_at', 'requested_by_name', 'approved_by_name', 'approved_at']

class AttendanceRecordSerializer(serializers.ModelSerializer):
    employee_name = serializers.CharField(source='employee.full_name', read_only=True)
    employee_code = serializers.CharField(source='employee.employee_code', read_only=True)
    department_name = serializers.CharField(source='employee.department.name', read_only=True, default='-')
    punches = AttendancePunchSerializer(many=True, read_only=True)
    corrections = AttendanceCorrectionBriefSerializer(source='correction_requests', many=True, read_only=True)
    shift_name = serializers.CharField(source='shift.name', read_only=True)

    class Meta:
        model = AttendanceRecord
        fields = [
            'id', 'employee_id', 'employee_name', 'employee_code', 'department_name',
            'attendance_date', 'shift_name', 'scheduled_in', 'scheduled_out',
            'actual_in', 'actual_out', 'work_hours', 'late_minutes', 'early_out_minutes',
            'overtime_minutes', 'status', 'remarks', 'is_locked', 'punches', 'corrections'
        ]
