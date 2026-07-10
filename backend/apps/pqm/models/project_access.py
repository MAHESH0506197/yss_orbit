from __future__ import annotations

from django.db import models
from apps.platform.models.base import TenantModel
from apps.pqm.models.project import PQMProject

class PQMProjectMember(TenantModel):
    user_id = models.UUIDField(db_index=True)
    project = models.ForeignKey(PQMProject, on_delete=models.CASCADE, related_name="members")
    role = models.CharField(max_length=50, default="MEMBER")
    assigned_by_id = models.UUIDField(null=True, blank=True)

    class Meta(TenantModel.Meta):
        db_table = "pqm_project_member"
        unique_together = [("project", "user_id")]

    def __str__(self):
        return f"User {self.user_id} in {self.project.name}"

class PQMAccessRequest(TenantModel):
    STATUS_CHOICES = [
        ("PENDING", "Pending"),
        ("APPROVED", "Approved"),
        ("REJECTED", "Rejected"),
    ]
    user_id = models.UUIDField(db_index=True)
    projects = models.JSONField(default=list, help_text="List of project UUIDs")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="PENDING")
    justification = models.TextField(blank=True, default="")
    approved_by_id = models.UUIDField(null=True, blank=True)

    class Meta(TenantModel.Meta):
        db_table = "pqm_access_request"

    def __str__(self):
        return f"Access Request by {self.user_id} - {self.status}"
