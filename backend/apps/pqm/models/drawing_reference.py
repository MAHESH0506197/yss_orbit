from django.db import models
from apps.platform.models.base import TenantModel

class PQMDrawingReference(TenantModel):
    organization_id = models.UUIDField(
        db_index=True,
        help_text="Organization ID",
    )
    project_id = models.UUIDField(
        db_index=True,
        help_text="Project ID",
    )
    drawing_number = models.CharField(max_length=255)
    revision = models.CharField(max_length=50)
    file_url = models.URLField(max_length=1000, blank=True, null=True)
    effective_date = models.DateField(blank=True, null=True)

    class Meta(TenantModel.Meta):
        db_table = "pqm_drawing_reference"

    def __str__(self) -> str:
        return f"{self.drawing_number} - Rev {self.revision}"
