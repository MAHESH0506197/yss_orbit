from rest_framework import serializers
from apps.hrms.models import AttendanceCorrectionRequest
from apps.hrms.api.serializers.employee_serializer import EmployeeListSerializer

class AttendanceCorrectionRequestSerializer(serializers.ModelSerializer):
    employee_details = EmployeeListSerializer(source='employee', read_only=True)
    
    class Meta:
        model = AttendanceCorrectionRequest
        fields = [
            'id',
            'business_unit_id',
            'employee',
            'employee_details',
            'record',
            'request_type',
            'requested_in_time',
            'requested_out_time',
            'reason',
            'status',
            'approved_by_user_id',
            'approved_at',
            'created_at',
            'updated_at',
        ]
        read_only_fields = [
            'id',
            'business_unit_id',
            'status',
            'approved_by_user_id',
            'approved_at',
            'created_at',
            'updated_at',
        ]
