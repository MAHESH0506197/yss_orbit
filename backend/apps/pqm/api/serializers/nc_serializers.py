# yss_orbit\backend\apps\pqm\api\serializers\nc_serializers.py
"""
NC Serializers — four variants:
  NCListSerializer   — lightweight list view (no nested objects)
  NCDetailSerializer — full detail with permission-based field gating
  NCCreateSerializer — write serializer for POST /nc/
  NCUpdateSerializer — write serializer for PATCH /nc/<pk>/
"""
from __future__ import annotations

from rest_framework import serializers

from apps.pqm.enums import NCStatus, Priority, Severity, BackchargeStatus, NCSeries
from apps.pqm.models import NonConformance
from apps.pqm.permissions import PQMPermission
from apps.pqm.api.serializers.attachment_serializer import AttachmentSerializer
from apps.pqm.api.serializers.approval_serializer import ApprovalStepSerializer
from apps.pqm.api.serializers.comment_serializer import CommentSerializer


# ---------------------------------------------------------------------------
# List serializer — summary fields only, no nested relations
# ---------------------------------------------------------------------------
class DropdownOptionInlineSerializer(serializers.Serializer):
    id = serializers.UUIDField()
    name = serializers.CharField()


class NCListSerializer(serializers.ModelSerializer):
    priority = DropdownOptionInlineSerializer(read_only=True, allow_null=True)
    severity = DropdownOptionInlineSerializer(read_only=True, allow_null=True)
    project = DropdownOptionInlineSerializer(read_only=True, allow_null=True)
    category = DropdownOptionInlineSerializer(read_only=True, allow_null=True)
    contractor = DropdownOptionInlineSerializer(read_only=True, allow_null=True)

    class Meta:
        model = NonConformance
        fields = [
            "id", "nc_number", "title", "status", "priority", "severity",
            "is_safety_critical", "project", "category",
            "assigned_to_id", "raised_by_id", "raised_date",
            "target_closure_date", "actual_closure_date",
            "contractor", "created_at",
        ]


# ---------------------------------------------------------------------------
# Detail serializer — full fields with permission gating
# ---------------------------------------------------------------------------
class NCDetailSerializer(serializers.ModelSerializer):
    attachments   = AttachmentSerializer(many=True, read_only=True)
    approval_steps = ApprovalStepSerializer(many=True, read_only=True)
    comments      = CommentSerializer(many=True, read_only=True)
    priority = DropdownOptionInlineSerializer(read_only=True, allow_null=True)
    severity = DropdownOptionInlineSerializer(read_only=True, allow_null=True)
    location_description = DropdownOptionInlineSerializer(read_only=True, allow_null=True)
    reference_type = DropdownOptionInlineSerializer(read_only=True, allow_null=True)
    project = DropdownOptionInlineSerializer(read_only=True, allow_null=True)
    category = DropdownOptionInlineSerializer(read_only=True, allow_null=True)
    sub_category = DropdownOptionInlineSerializer(read_only=True, allow_null=True)
    contractor = DropdownOptionInlineSerializer(read_only=True, allow_null=True)

    raised_by_name = serializers.SerializerMethodField()
    assigned_to_name = serializers.SerializerMethodField()

    def get_raised_by_name(self, obj):
        from django.contrib.auth import get_user_model
        User = get_user_model()
        if obj.raised_by_id:
            user = User.objects.filter(id=obj.raised_by_id).first()
            return f"{user.first_name} {user.last_name}".strip() if user else None
        return None

    def get_assigned_to_name(self, obj):
        from django.contrib.auth import get_user_model
        User = get_user_model()
        if obj.assigned_to_id:
            user = User.objects.filter(id=obj.assigned_to_id).first()
            return f"{user.first_name} {user.last_name}".strip() if user else None
        return None

    class Meta:
        model = NonConformance
        fields = "__all__"

    def get_fields(self):
        fields = super().get_fields()
        request = self.context.get("request")
        if request:
            user = request.user
            # Gate backcharge fields
            if not PQMPermission.check_permission(request, PQMPermission.VIEW_BACKCHARGE):
                fields.pop("backcharge_amount", None)
                fields.pop("backcharge_status", None)
            # Gate comments to viewers only
            if not PQMPermission.check_permission(request, PQMPermission.VIEW_COMMENTS):
                fields.pop("comments", None)
            # Gate GPS to non-auditors (hide raw coordinates)
            if not PQMPermission.check_permission(request, PQMPermission.VIEW_AUDIT):
                # Strip GPS from nested attachments is handled in AttachmentSerializer
                pass
        return fields


# ---------------------------------------------------------------------------
# Create serializer — validates required fields on NC creation
# ---------------------------------------------------------------------------
class NCCreateSerializer(serializers.ModelSerializer):
    priority_id = serializers.UUIDField(write_only=True, required=False, allow_null=True)
    severity_id = serializers.UUIDField(write_only=True, required=False, allow_null=True)
    location_description_id = serializers.UUIDField(write_only=True, required=False, allow_null=True)
    reference_type_id = serializers.UUIDField(write_only=True, required=False, allow_null=True)

    class Meta:
        model = NonConformance
        fields = [
            "title", "description", "project", 
            "category", "sub_category", "contractor",
            "location_details", "block", "zone",
            "drawing_reference", "specification_reference", "standard_reference",
            "priority_id", "severity_id", "is_safety_critical",
            "location_description_id", "reference_type_id", "reference_description",
            "checklist_reference", "checklist_reference_text",
            "client_captured_at", "raised_date",
            "site_quality_incharge_id", "project_incharge_id", "assigned_to_id", "target_closure_date",
        ]

    def validate_project(self, value):
        request = self.context.get("request")
        if request and hasattr(request, "business_unit_id"):
            if str(value.business_unit_id) != str(request.business_unit_id):
                raise serializers.ValidationError("Project does not belong to your business unit.")
        return value

    # site validation removed as site is no longer part of the model


# ---------------------------------------------------------------------------
# Update serializer — only editable in Draft / Returned states
# ---------------------------------------------------------------------------
EDITABLE_STATUSES = {NCStatus.DRAFT, NCStatus.REJECTED}


class NCUpdateSerializer(serializers.ModelSerializer):
    priority_id = serializers.UUIDField(write_only=True, required=False, allow_null=True)
    severity_id = serializers.UUIDField(write_only=True, required=False, allow_null=True)
    location_description_id = serializers.UUIDField(write_only=True, required=False, allow_null=True)
    reference_type_id = serializers.UUIDField(write_only=True, required=False, allow_null=True)

    class Meta:
        model = NonConformance
        fields = [
            "title", "description", "priority_id", "severity_id", "is_safety_critical",
            "category", "sub_category", "contractor",
            "location_details", "block", "zone",
            "drawing_reference", "specification_reference", "standard_reference",
            "location_description_id", "reference_type_id", "reference_description",
            "root_cause_description", "root_cause_category",
            "corrective_action", "preventive_action",
            "assigned_to_id", "site_incharge_id",
            "site_quality_incharge_id", "project_incharge_id", "target_closure_date",
            "backcharge_amount", "backcharge_status",
        ]

    def validate(self, attrs):
        instance = self.instance
        if instance and instance.status not in EDITABLE_STATUSES:
            # Allow progress-update fields regardless of status
            progress_only_fields = {
                "root_cause_description", "root_cause_category",
                "corrective_action", "preventive_action",
            }
            non_progress = set(attrs.keys()) - progress_only_fields
            if non_progress:
                raise serializers.ValidationError(
                    f"NC in status '{instance.status}' only allows updating progress fields."
                )
        return attrs
