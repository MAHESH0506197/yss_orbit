# yss_orbit\backend\apps\pqm\api\serializers\extension_serializer.py
from rest_framework import serializers
from django.utils import timezone
from apps.pqm.enums import ApprovalDecision
from apps.pqm.models import PQMExtensionRequest


class ExtensionRequestSerializer(serializers.Serializer):
    requested_date = serializers.DateField()
    reason = serializers.CharField(min_length=10)

    def validate_requested_date(self, value):
        if value <= timezone.now().date():
            raise serializers.ValidationError("Extension date must be in the future.")
        return value


class ExtensionDecisionSerializer(serializers.Serializer):
    decision = serializers.ChoiceField(
        choices=[(ApprovalDecision.APPROVED, "Approved"), (ApprovalDecision.REJECTED, "Rejected")]
    )
    decision_comments = serializers.CharField(allow_blank=True, required=False, default="")

    def validate(self, attrs):
        if attrs["decision"] == ApprovalDecision.REJECTED:
            if not attrs.get("decision_comments", "").strip():
                raise serializers.ValidationError(
                    {"decision_comments": "Comments required when rejecting extension."}
                )
        return attrs
