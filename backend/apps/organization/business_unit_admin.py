# apps/business_unit/admin.py
# FIX-BUG03: Removed 'industry' from fieldsets — field deleted in migration 0013.
# FIX (IMPLEMENTATION_PLAN.md item 3/4): Registered BusinessUnitModule —
# previously unregistered, meaning platform admins had NO way to inspect
# which modules are activated for which Business Units outside the API.
from django.contrib import admin
from django.utils.html import format_html
from apps.organization.models import BusinessUnit, BusinessUnitModule


@admin.register(BusinessUnit)
class BusinessUnitAdmin(admin.ModelAdmin):
    list_display   = ("name", "code", "organization", "get_business_domain",
                      "city", "is_main_branch", "status_badge", "created_at")
    list_filter    = ("organization__business_domain", "is_active", "is_deleted", "is_main_branch", "country")
    search_fields  = ("name", "code", "email", "organization__name", "city")
    readonly_fields = ("id", "created_at", "updated_at", "created_by_id", "updated_by_id",
                       "deleted_at", "deleted_by_id", "effective_timezone", "effective_currency")
    ordering = ("organization", "name")
    list_per_page = 40
    list_select_related = ("organization", "organization__business_domain")

    fieldsets = (
        ("Identity", {
            # FIX-BUG03: 'industry' removed — deleted in migration 0013
            "fields": ("id", "organization", "name", "code"),
        }),
        ("Contact", {"fields": ("email", "phone")}),
        ("Address", {
            "fields": ("address_line1", "address_line2", "city", "state", "country", "pincode"),
        }),
        ("Compliance / Legal", {
            "fields": ("registration_number", "gst_number", "pan_number"),
            "classes": ("collapse",),
        }),
        ("Locale Overrides", {
            "fields": ("timezone", "currency_code", "effective_timezone", "effective_currency"),
            "description": "Leave blank to inherit from parent Organization.",
        }),
        ("Branding", {"fields": ("logo_url",)}),
        ("References & Flags", {
            "fields": ("manager_id", "is_main_branch", "is_active", "is_deleted"),
        }),
        ("Audit Trail", {
            "fields": ("created_at", "updated_at", "created_by_id", "updated_by_id",
                       "deleted_at", "deleted_by_id"),
            "classes": ("collapse",),
        }),
    )

    @admin.display(description="Status", boolean=False)
    def status_badge(self, obj):
        if obj.is_deleted:
            return format_html('<span style="color:#ef4444;font-weight:bold">⬤ Archived</span>')
        if obj.is_active:
            return format_html('<span style="color:#10b981;font-weight:bold">⬤ Active</span>')
        return format_html('<span style="color:#f59e0b;font-weight:bold">⬤ Inactive</span>')

    @admin.display(description="Business Domain")
    def get_business_domain(self, obj):
        return obj.business_domain


@admin.register(BusinessUnitModule)
class BusinessUnitModuleAdmin(admin.ModelAdmin):
    """
    FIX (IMPLEMENTATION_PLAN.md item 3/4): Admin visibility into per-BU
    module activation — the table ModuleSubscriptionMiddleware reads.
    Read-mostly: status changes should normally go through
    BusinessUnitModuleViewSet (activate/deactivate/suspend), which run E04
    §3.4 dependency validation. The admin allows `status` editing for
    emergency/support overrides, but `module`, `business_unit_id`,
    `activated_by`, and `activated_at` are read-only to prevent accidental
    re-pointing of a subscription row to a different module/BU (which would
    violate the unique_business_unit_module constraint anyway, but better
    to never present the option).
    """
    list_display = (
        "business_unit_id", "module", "status_badge", "is_active_display",
        "trial_ends_at", "expires_at", "activated_by", "activated_at",
    )
    list_filter = ("status", "module__category", "module")
    search_fields = ("business_unit_id", "module__code", "module__name")
    list_select_related = ("module", "activated_by")
    readonly_fields = (
        "id", "business_unit_id", "module", "activated_by", "activated_at",
        "created_at", "updated_at", "created_by_id", "updated_by_id",
        "deleted_at", "deleted_by_id",
    )
    ordering = ("business_unit_id", "module__sort_order")
    list_per_page = 50

    fieldsets = (
        ("Subscription", {
            "fields": ("id", "business_unit_id", "module", "status"),
        }),
        ("Trial / Expiry", {
            "fields": ("trial_ends_at", "expires_at"),
        }),
        ("Plan Overrides", {
            "fields": ("plan_limit",),
            "description": "JSON object — custom per-BU limit overrides for this module.",
        }),
        ("Activation Record", {
            "fields": ("activated_by", "activated_at"),
        }),
        ("Audit Trail", {
            "fields": ("created_at", "updated_at", "created_by_id", "updated_by_id",
                       "deleted_at", "deleted_by_id"),
            "classes": ("collapse",),
        }),
    )

    @admin.display(description="Status")
    def status_badge(self, obj):
        colors = {
            "active": "#10b981", "trial": "#3b82f6",
            "suspended": "#f59e0b", "expired": "#ef4444",
        }
        color = colors.get(obj.status, "#6b7280")
        return format_html(
            '<span style="color:{};font-weight:bold">⬤ {}</span>',
            color, obj.get_status_display(),
        )

    @admin.display(description="Effective", boolean=True)
    def is_active_display(self, obj):
        return obj.is_active
