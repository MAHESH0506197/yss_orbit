# yss_orbit\backend\apps\reporting\admin.py
from django.contrib import admin
from apps.observability.models import ReportTemplate, ReportExecution

@admin.register(ReportTemplate)
class ReportTemplateAdmin(admin.ModelAdmin):
    list_display = ('id',)
    search_fields = ('id',)

@admin.register(ReportExecution)
class ReportExecutionAdmin(admin.ModelAdmin):
    list_display = ('id',)
    search_fields = ('id',)


