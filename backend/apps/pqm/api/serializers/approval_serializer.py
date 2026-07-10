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
    class Meta:
        model = PQMApprovalStep
        fields = [
            "id", "stage", "sequence_order", "approver_id",
            "decision", "comments", "decided_at",
        ]
        read_only_fields = fields
