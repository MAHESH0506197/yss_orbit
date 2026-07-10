# yss_orbit\backend\apps\pqm\admin.py
"""Django Admin registrations for PQM models."""
from __future__ import annotations

from django.contrib import admin

from apps.pqm.models import (
    PQMProject, PQMSite, PQMSiteGeofence, PQMContractor,
    NonConformance, PQMAttachment, PQMApprovalStep, PQMStatusHistory,
    PQMComment, PQMNotificationLog, PQMEscalationConfig, PQMSequenceCounter,
    PQMExtensionRequest, PQMSavedView, PQMChecklist, PQMChecklistItem,
)


@admin.register(PQMProject)
class PQMProjectAdmin(admin.ModelAdmin):
    list_display = ["name", "code", "business_unit_id", "is_active", "created_at"]
    list_filter = ["is_active"]
    search_fields = ["name", "code"]


@admin.register(PQMSite)
class PQMSiteAdmin(admin.ModelAdmin):
    list_display = ["name", "code", "project", "is_active"]
    list_filter = ["is_active"]
    search_fields = ["name", "code"]


@admin.register(PQMSiteGeofence)
class PQMSiteGeofenceAdmin(admin.ModelAdmin):
    list_display = ["site", "center_lat", "center_lng", "radius_meters"]


@admin.register(PQMContractor)
class PQMContractorAdmin(admin.ModelAdmin):
    list_display = ["name", "contact_person", "contact_email", "is_active"]
    list_filter = ["is_active"]
    search_fields = ["name", "contact_email"]


@admin.register(NonConformance)
class NonConformanceAdmin(admin.ModelAdmin):
    list_display = [
        "nc_number", "title", "status", "priority", "severity",
        "is_safety_critical", "project", "raised_date",
        "target_closure_date", "actual_closure_date",
    ]
    list_filter = ["status", "priority", "severity", "is_safety_critical", "is_migrated"]
    search_fields = ["nc_number", "title", "description"]
    date_hierarchy = "raised_date"
    readonly_fields = ["nc_number", "raised_date", "actual_closure_date", "reopen_count"]


@admin.register(PQMAttachment)
class PQMAttachmentAdmin(admin.ModelAdmin):
    list_display = ["file_name", "nc", "attachment_stage", "uploaded_by_id", "version", "gps_within_geofence"]
    list_filter = ["attachment_stage", "gps_within_geofence"]
    search_fields = ["file_name", "nc__nc_number"]


@admin.register(PQMApprovalStep)
class PQMApprovalStepAdmin(admin.ModelAdmin):
    list_display = ["nc", "stage", "sequence_order", "approver_id", "decision", "decided_at"]
    list_filter = ["stage", "decision"]


@admin.register(PQMStatusHistory)
class PQMStatusHistoryAdmin(admin.ModelAdmin):
    list_display = ["nc", "event_type", "from_status", "to_status", "actor_id", "created_at"]
    list_filter = ["event_type"]
    search_fields = ["nc__nc_number"]
    readonly_fields = [f.name for f in PQMStatusHistory._meta.fields]

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False


@admin.register(PQMComment)
class PQMCommentAdmin(admin.ModelAdmin):
    list_display = ["nc", "author_id", "is_internal", "created_at"]
    list_filter = ["is_internal"]


@admin.register(PQMNotificationLog)
class PQMNotificationLogAdmin(admin.ModelAdmin):
    list_display = ["nc", "event_type", "channel", "recipient_id", "status", "sent_at"]
    list_filter = ["status", "channel", "event_type"]
    readonly_fields = [f.name for f in PQMNotificationLog._meta.fields]

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False


@admin.register(PQMEscalationConfig)
class PQMEscalationConfigAdmin(admin.ModelAdmin):
    list_display = ["organization_id", "business_unit_id", "priority", "sla_days"]
    list_filter = ["priority"]


@admin.register(PQMSequenceCounter)
class PQMSequenceCounterAdmin(admin.ModelAdmin):
    list_display = ["organization_id", "year", "series", "last_value"]
    readonly_fields = ["organization_id", "year", "series", "last_value"]

    def has_add_permission(self, request):
        return False


@admin.register(PQMExtensionRequest)
class PQMExtensionRequestAdmin(admin.ModelAdmin):
    list_display = ["nc", "requested_by_id", "original_target_date", "requested_date", "decision"]
    list_filter = ["decision"]


@admin.register(PQMSavedView)
class PQMSavedViewAdmin(admin.ModelAdmin):
    list_display = ["name", "owner_id", "is_default", "is_shared_with_role_id"]


@admin.register(PQMChecklist)
class PQMChecklistAdmin(admin.ModelAdmin):
    list_display = ["name", "version", "is_active", "category"]
    list_filter = ["is_active"]


@admin.register(PQMChecklistItem)
class PQMChecklistItemAdmin(admin.ModelAdmin):
    list_display = ["checklist", "sequence_order", "item_text", "is_mandatory"]
