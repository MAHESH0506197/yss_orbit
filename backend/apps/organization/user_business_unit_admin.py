# yss_orbit\backend\apps\user_business_unit\admin.py
"""
Django admin registration for UserBusinessUnit memberships.
"""
from django.contrib import admin
from apps.organization.models.user_business_unit_model import UserBusinessUnitModel


@admin.register(UserBusinessUnitModel)
class UserBusinessUnitAdmin(admin.ModelAdmin):
    list_display = [
        "id",
        "user",
        "business_unit",
        "role",
        "is_active_membership",
        "joined_at",
    ]
    list_filter = ["is_active_membership", "business_unit"]
    search_fields = ["user__email", "business_unit__name"]
    readonly_fields = ["id", "joined_at", "created_at", "updated_at"]
    ordering = ["-joined_at"]
