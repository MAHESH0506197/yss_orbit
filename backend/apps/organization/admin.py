from django.contrib import admin
from apps.organization.models import Organization

@admin.register(Organization)
class OrganizationAdmin(admin.ModelAdmin):
    pass
