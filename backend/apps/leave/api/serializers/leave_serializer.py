# yss_orbit\backend\apps\leave\api\serializers\leave_serializer.py
from rest_framework import serializers
from apps.hrms.models import LeaveType, LeaveBalance, LeaveRequest

class LeaveTypeSerializer(serializers.ModelSerializer):
    days_allowed = serializers.IntegerField(source='max_days_per_request', read_only=True)
    is_carry_forward = serializers.BooleanField(source='allow_carry_forward', read_only=True)

    class Meta:
        model = LeaveType
        fields = ["id", "name", "days_allowed", "is_carry_forward"]

class LeaveBalanceSerializer(serializers.ModelSerializer):
    balance = serializers.DecimalField(source='closing_balance', max_digits=5, decimal_places=2, read_only=True)

    class Meta:
        model = LeaveBalance
        fields = ["id", "employee_id", "leave_type", "balance"]

class LeaveApplicationSerializer(serializers.ModelSerializer):
    approver_id = serializers.UUIDField(source='manager_approved_by_id', read_only=True)

    class Meta:
        model = LeaveRequest
        fields = ["id", "employee_id", "leave_type", "start_date", "end_date", "reason", "status", "approver_id"]

class ApplyLeaveSerializer(serializers.Serializer):
    leave_type_id = serializers.UUIDField()
    start_date = serializers.DateField()
    end_date = serializers.DateField()
    reason = serializers.CharField()

