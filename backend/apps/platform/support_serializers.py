# yss_orbit\backend\apps\support\serializers.py
from rest_framework import serializers
from .models import TicketCategory, Ticket, TicketComment, TicketAttachment

class TicketCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = TicketCategory
        fields = ["id", "name", "description", "is_active_category", "created_at", "updated_at"]
        read_only_fields = ["id", "created_at", "updated_at"]

class TicketAttachmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = TicketAttachment
        fields = ["id", "file_name", "file_url", "file_size", "created_at"]
        read_only_fields = ["id", "created_at"]

class TicketCommentSerializer(serializers.ModelSerializer):
    attachments = TicketAttachmentSerializer(many=True, read_only=True)

    class Meta:
        model = TicketComment
        fields = ["id", "comment_text", "author_id", "is_internal", "created_at", "attachments"]
        read_only_fields = ["id", "created_at", "attachments"]

class TicketSerializer(serializers.ModelSerializer):
    category_details = TicketCategorySerializer(source="category", read_only=True)
    
    class Meta:
        model = Ticket
        fields = [
            "id", "subject", "description", "category", "category_details", 
            "priority", "status", "assigned_to", "customer_id", "resolved_at", 
            "created_at", "updated_at"
        ]
        read_only_fields = ["id", "created_at", "updated_at", "resolved_at"]

class TicketDetailSerializer(TicketSerializer):
    comments = TicketCommentSerializer(many=True, read_only=True)
    attachments = TicketAttachmentSerializer(many=True, read_only=True)
    
    class Meta(TicketSerializer.Meta):
        fields = TicketSerializer.Meta.fields + ["comments", "attachments"]
