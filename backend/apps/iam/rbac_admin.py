# yss_orbit\backend\apps\rbac\admin.py
from django.contrib import admin
from .models import Permission, Role, RolePermission, UserRole

@admin.register(Permission)
class PermissionAdmin(admin.ModelAdmin):
    list_display = ('code', 'name', 'module', 'is_active')
    search_fields = ('code', 'name', 'module')
    list_filter = ('module', 'is_active')

@admin.register(Role)
class RoleAdmin(admin.ModelAdmin):
    list_display = ('name', 'role_type', 'business_unit_id', 'is_active', 'is_default')
    search_fields = ('name', 'business_unit_id')
    list_filter = ('role_type', 'is_active', 'is_default')

@admin.register(RolePermission)
class RolePermissionAdmin(admin.ModelAdmin):
    list_display = ('role', 'permission', 'is_active', 'is_deleted', 'created_at', 'created_by_id', 'deleted_by_id')
    list_filter = ('is_active', 'is_deleted')
    search_fields = ('role__name', 'permission__code')
    readonly_fields = ('created_at', 'updated_at', 'deleted_at')

@admin.register(UserRole)
class UserRoleAdmin(admin.ModelAdmin):
    list_display = ('user_id', 'role', 'business_unit_id', 'is_active', 'assigned_at')
    search_fields = ('user_id', 'business_unit_id')
    list_filter = ('is_active',)
