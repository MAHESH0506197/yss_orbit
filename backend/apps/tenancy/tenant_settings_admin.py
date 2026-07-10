# yss_orbit\backend\apps\tenant_settings\admin.py
from django.contrib import admin

# Basic admin configuration
class BaseAdmin(admin.ModelAdmin):
    list_display = ('id', 'created_at', 'updated_at')
    readonly_fields = ('created_at', 'updated_at')
    search_fields = ('id',)

# Register your models here, e.g., admin.site.register(MyModel, BaseAdmin)
