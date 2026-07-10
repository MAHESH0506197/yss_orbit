from rest_framework import serializers

from apps.hrms.models import LeavePolicy, LeaveType, LeaveBalance, LeaveRequest, LeaveRequestHistory, LeaveAttachment


class LeavePolicySerializer(serializers.ModelSerializer):
    class Meta:
        model = LeavePolicy
        fields = ["id", "name", "description", "is_active", "created_at"]
        read_only_fields = ["id", "created_at"]


class LeaveTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = LeaveType
        fields = [
            "id", "policy", "code", "name", "is_paid", "is_lop", "requires_approval",
            "requires_attachment", "attachment_after_days", "requires_manager_approval",
            "requires_hr_approval", "allow_half_day", "allow_negative_balance",
            "allow_carry_forward", "max_carry_forward", "accrual_rate_per_month",
            "max_days_per_request", "min_notice_days", "exclude_weekends",
            "exclude_holidays", "color", "is_active", "created_at"
        ]
        read_only_fields = ["id", "created_at"]


class LeaveBalanceSerializer(serializers.ModelSerializer):
    leave_type_name = serializers.CharField(source="leave_type.name", read_only=True)
    leave_type_color = serializers.CharField(source="leave_type.color", read_only=True)

    class Meta:
        model = LeaveBalance
        fields = [
            "id", "employee", "leave_type", "leave_type_name", "leave_type_color", "year",
            "opening_balance", "accrued_days", "consumed_days", "adjusted_days",
            "encashed_days", "closing_balance", "created_at"
        ]
        read_only_fields = [
            "id", "leave_type_name", "leave_type_color", "created_at",
            "closing_balance", "consumed_days", "accrued_days", "encashed_days"
        ]


class LeaveRequestHistorySerializer(serializers.ModelSerializer):
    changed_by_name = serializers.CharField(source="changed_by.first_name", read_only=True)

    class Meta:
        model = LeaveRequestHistory
        fields = ["id", "status", "changed_by", "changed_by_name", "remarks", "created_at"]
        read_only_fields = fields


class LeaveAttachmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = LeaveAttachment
        fields = ["id", "file", "uploaded_by", "uploaded_at"]
        read_only_fields = fields


class LeaveRequestSerializer(serializers.ModelSerializer):
    leave_type_name = serializers.CharField(source="leave_type.name", read_only=True)
    history = LeaveRequestHistorySerializer(many=True, read_only=True)
    attachments = LeaveAttachmentSerializer(many=True, read_only=True)

    class Meta:
        model = LeaveRequest
        fields = [
            "id", "employee", "leave_type", "leave_type_name", "start_date", "end_date",
            "session", "status", "reason", "manager_approved_by", "manager_comments",
            "hr_approved_by", "hr_comments", "history", "attachments", "created_at"
        ]
        read_only_fields = [
            "id", "employee", "status", "manager_approved_by", "hr_approved_by",
            "manager_comments", "hr_comments", "created_at"
        ]
