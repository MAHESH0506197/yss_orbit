# yss_orbit\backend\apps\integration\admin.py
from django.contrib import admin
from apps.platform.models.integration_model import Integration
from apps.platform.models.webhook_model import Webhook
from apps.platform.models.webhook_delivery_log_model import WebhookDeliveryLog

@admin.register(Integration)
class IntegrationAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'provider', 'is_active', 'created_at')
    list_filter = ('provider', 'is_active', 'created_at')
    search_fields = ('name', 'provider')
    readonly_fields = ('id', 'created_at', 'updated_at')

@admin.register(Webhook)
class WebhookAdmin(admin.ModelAdmin):
    list_display = ('id', 'url', 'is_active', 'created_at')
    list_filter = ('is_active', 'created_at')
    search_fields = ('url', 'description')
    readonly_fields = ('id', 'created_at', 'updated_at', 'secret')

@admin.register(WebhookDeliveryLog)
class WebhookDeliveryLogAdmin(admin.ModelAdmin):
    list_display = ('id', 'webhook_id', 'event_type', 'success', 'status_code', 'created_at')
    list_filter = ('success', 'event_type', 'created_at')
    search_fields = ('event_type', 'error_message', 'webhook_id')
    readonly_fields = ('id', 'created_at', 'updated_at')
