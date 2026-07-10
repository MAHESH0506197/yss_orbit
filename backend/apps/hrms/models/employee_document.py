# yss_orbit\backend\apps\hrms\models\employee_document.py
from django.db import models
from apps.platform.models.base import TenantModel


class EmployeeDocument(TenantModel):
    """Employee document attachments (offer letter, ID proofs, etc.)."""

    class DocumentType(models.TextChoices):
        OFFER_LETTER = "OFFER_LETTER", "Offer Letter"
        APPOINTMENT_LETTER = "APPOINTMENT_LETTER", "Appointment Letter"
        SALARY_REVISION_LETTER = "SALARY_REVISION_LETTER", "Salary Revision Letter"
        EXPERIENCE_LETTER = "EXPERIENCE_LETTER", "Experience Letter"
        RESIGNATION_LETTER = "RESIGNATION_LETTER", "Resignation Letter"
        AADHAAR = "AADHAAR", "Aadhaar Card"
        PAN_CARD = "PAN_CARD", "PAN Card"
        PASSPORT = "PASSPORT", "Passport"
        EDUCATION = "EDUCATION", "Education Certificate"
        OTHER = "OTHER", "Other"

    employee = models.ForeignKey(
        "hrms.Employee",
        on_delete=models.CASCADE,
        related_name="documents",
    )
    document_type = models.CharField(max_length=30, choices=DocumentType.choices, db_index=True)
    name = models.CharField(max_length=255)
    file_asset = models.ForeignKey("platform.FileUpload", on_delete=models.PROTECT, null=True, blank=True)
    expiry_date = models.DateField(null=True, blank=True)
    is_verified = models.BooleanField(default=False)
    uploaded_by_id = models.UUIDField(null=True, blank=True)
    notes = models.TextField(blank=True)

    class Meta(TenantModel.Meta):
        db_table = "hrms_employee_documents"
