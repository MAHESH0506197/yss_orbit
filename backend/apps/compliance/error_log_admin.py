# yss_orbit\backend\apps\error_log\admin.py
from django.contrib import admin
from apps.compliance.models import ErrorLog

@admin.register(ErrorLog)
class ErrorLogAdmin(admin.ModelAdmin):
    list_display = ('id', 'severity', 'exception_type', 'endpoint', 'resolved', 'created_at')
    list_filter = ('severity', 'resolved', 'created_at')
    search_fields = ('message', 'exception_type', 'endpoint', 'correlation_id')
    readonly_fields = ('id', 'created_at')
