# yss_orbit\backend\apps\outbox\admin.py
from django.contrib import admin
from apps.platform.models.outbox_model import OutboxMessage
from apps.platform.models.dlq_model import OutboxDeadLetter

@admin.register(OutboxMessage)
class OutboxMessageAdmin(admin.ModelAdmin):
    list_display = ('id', 'message_type', 'destination', 'status', 'retry_count', 'created_at')
    list_filter = ('status', 'message_type', 'created_at')
    search_fields = ('message_type', 'destination', 'last_error')
    readonly_fields = ('id', 'created_at', 'updated_at', 'published_at')

@admin.register(OutboxDeadLetter)
class OutboxDeadLetterAdmin(admin.ModelAdmin):
    list_display = ('id', 'message_type', 'destination', 'resolved', 'created_at')
    list_filter = ('resolved', 'message_type', 'created_at')
    search_fields = ('message_type', 'destination', 'error_reason')
    readonly_fields = ('id', 'created_at', 'original_message_id')
