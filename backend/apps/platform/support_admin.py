# yss_orbit\backend\apps\support\admin.py
from django.contrib import admin
from .models import Ticket, TicketCategory, TicketComment, TicketAttachment

@admin.register(TicketCategory)
class TicketCategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'is_active_category', 'created_at')
    search_fields = ('name',)

@admin.register(Ticket)
class TicketAdmin(admin.ModelAdmin):
    list_display = ('subject', 'category', 'priority', 'status', 'assigned_to', 'created_at')
    list_filter = ('status', 'priority', 'category')
    search_fields = ('subject', 'description')

@admin.register(TicketComment)
class TicketCommentAdmin(admin.ModelAdmin):
    list_display = ('ticket', 'author_id', 'is_internal', 'created_at')
    list_filter = ('is_internal',)

@admin.register(TicketAttachment)
class TicketAttachmentAdmin(admin.ModelAdmin):
    list_display = ('file_name', 'ticket', 'file_size')