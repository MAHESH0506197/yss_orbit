# yss_orbit\backend\apps\support\models.py
from django.db import models
from apps.platform.models.base import TenantModel

class TicketCategory(TenantModel):
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    is_active_category = models.BooleanField(default=True)

    class Meta(TenantModel.Meta):
        verbose_name_plural = "Ticket Categories"

    def __str__(self) -> str:
        return self.name

class Ticket(TenantModel):
    class Priority(models.TextChoices):
        LOW = "LOW", "Low"
        MEDIUM = "MEDIUM", "Medium"
        HIGH = "HIGH", "High"
        URGENT = "URGENT", "Urgent"

    class Status(models.TextChoices):
        OPEN = "OPEN", "Open"
        IN_PROGRESS = "IN_PROGRESS", "In Progress"
        WAITING = "WAITING", "Waiting on Customer"
        RESOLVED = "RESOLVED", "Resolved"
        CLOSED = "CLOSED", "Closed"

    subject = models.CharField(max_length=255)
    description = models.TextField()
    category = models.ForeignKey(TicketCategory, on_delete=models.SET_NULL, null=True, related_name="tickets")
    priority = models.CharField(max_length=20, choices=Priority.choices, default=Priority.MEDIUM)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.OPEN)
    
    assigned_to = models.UUIDField(null=True, blank=True, help_text="ID of the assigned agent user")
    customer_id = models.UUIDField(help_text="ID of the customer who raised the ticket")

    resolved_at = models.DateTimeField(null=True, blank=True)

    class Meta(TenantModel.Meta):
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return f"{self.subject} ({self.status})"

class TicketComment(TenantModel):
    ticket = models.ForeignKey(Ticket, on_delete=models.CASCADE, related_name="comments")
    comment_text = models.TextField()
    author_id = models.UUIDField(help_text="ID of the user who commented")
    is_internal = models.BooleanField(default=False, help_text="If true, only agents can see this comment")

    class Meta(TenantModel.Meta):
        ordering = ["created_at"]

    def __str__(self) -> str:
        return f"Comment on {self.ticket.subject} by {self.author_id}"

class TicketAttachment(TenantModel):
    ticket = models.ForeignKey(Ticket, on_delete=models.CASCADE, related_name="attachments")
    comment = models.ForeignKey(TicketComment, on_delete=models.SET_NULL, null=True, blank=True, related_name="attachments")
    file_url = models.URLField(max_length=1024)
    file_name = models.CharField(max_length=255)
    file_size = models.PositiveIntegerField(help_text="Size in bytes")

    class Meta(TenantModel.Meta):
        pass

    def __str__(self) -> str:
        return self.file_name
