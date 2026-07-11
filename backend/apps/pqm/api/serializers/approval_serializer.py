# yss_orbit\backend\apps\pqm\api\serializers\approval_serializer.py
from rest_framework import serializers
from apps.pqm.enums import ApprovalDecision
from apps.pqm.models import PQMApprovalStep


class ApprovalDecisionSerializer(serializers.Serializer):
    decision = serializers.ChoiceField(choices=ApprovalDecision.choices)
    comments = serializers.CharField(allow_blank=True, required=False, default="")

    def validate(self, attrs):
        if attrs["decision"] in (ApprovalDecision.REJECTED, ApprovalDecision.REWORK):
            if not attrs.get("comments", "").strip():
                raise serializers.ValidationError(
                    {"comments": "A comment is required when rejecting or requesting rework."}
                )
        return attrs


class ApprovalStepSerializer(serializers.ModelSerializer):
    approver_name = serializers.SerializerMethodField()

    def get_approver_name(self, obj):
        from django.contrib.auth import get_user_model
        User = get_user_model()
        if obj.approver_id:
            user = User.objects.filter(id=obj.approver_id).first()
            return f"{user.first_name} {user.last_name}".strip() if user else None
        return None

    class Meta:
        model = PQMApprovalStep
        fields = [
            "id", "stage", "sequence_order", "approver_id", "approver_name",
            "decision", "comments", "decided_at",
        ]
        read_only_fields = fields
