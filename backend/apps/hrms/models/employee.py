# yss_orbit\backend\apps\hrms\models\employee.py
from django.db import models
from apps.platform.models.base import TenantModel
from encrypted_model_fields.fields import EncryptedCharField


class Employee(TenantModel):
    """
    Employee record. Central HRMS entity.
    Links to users.User (user_id) for login access.
    PII fields marked with # PII — encrypted at DB level in production.
    """

    class EmploymentType(models.TextChoices):
        FULL_TIME = "FULL_TIME", "Full Time"
        PART_TIME = "PART_TIME", "Part Time"
        CONTRACT = "CONTRACT", "Contract"
        INTERN = "INTERN", "Intern"
        CONSULTANT = "CONSULTANT", "Consultant"

    class EmploymentStatus(models.TextChoices):
        ACTIVE = "ACTIVE", "Active"
        ON_LEAVE = "ON_LEAVE", "On Leave"
        NOTICE_PERIOD = "NOTICE_PERIOD", "Notice Period"
        TERMINATED = "TERMINATED", "Terminated"
        RESIGNED = "RESIGNED", "Resigned"
        RETIRED = "RETIRED", "Retired"

    class Gender(models.TextChoices):
        MALE = "M", "Male"
        FEMALE = "F", "Female"
        OTHER = "O", "Other"
        PREFER_NOT = "N", "Prefer not to say"

    class MaritalStatus(models.TextChoices):
        SINGLE = "SINGLE", "Single"
        MARRIED = "MARRIED", "Married"
        DIVORCED = "DIVORCED", "Divorced"
        WIDOWED = "WIDOWED", "Widowed"

    class WorkerType(models.TextChoices):
        """
        Distinguishes between permanent employees, contractors, consultants, etc.
        Used by payroll engine to determine statutory deduction applicability:
        - CONTRACTOR, CONSULTANT: excluded from PF/ESI/PT by default (configurable)
        - EMPLOYEE, PROBATIONER: standard deductions apply
        - INTERN, APPRENTICE: configurable per BU policy
        """
        EMPLOYEE    = 'EMPLOYEE',    'Employee (Permanent)'
        CONTRACTOR  = 'CONTRACTOR',  'Contractor (Third-party)'
        CONSULTANT  = 'CONSULTANT',  'Consultant (Individual)'
        INTERN      = 'INTERN',      'Intern'
        APPRENTICE  = 'APPRENTICE',  'Apprentice'
        PROBATIONER = 'PROBATIONER', 'Probationer'

    # Identity
    employee_code = models.CharField(max_length=30, db_index=True)
    user_id = models.UUIDField(null=True, blank=True, db_index=True)  # FK to users.User
    worker_type = models.CharField(
        max_length=15, choices=WorkerType.choices, default=WorkerType.EMPLOYEE, db_index=True
    )
    # Contractor / Consultant specific (ignored for standard EMPLOYEE worker_type)
    contract_start_date = models.DateField(null=True, blank=True)
    contract_end_date   = models.DateField(null=True, blank=True, db_index=True)
    agency_name         = models.CharField(max_length=200, blank=True)

    # State code for Professional Tax lookup (e.g. 'KA', 'MH', 'TN', 'AP').
    # Maps to ProfessionalTaxSlab.state_code in the payroll domain.
    # Leave blank if the employee's work location is not in a PT-applicable state.
    state_code = models.CharField(max_length=3, blank=True, default='', db_index=True)

    # Personal info (PII)
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    middle_name = models.CharField(max_length=100, blank=True)
    gender = models.CharField(max_length=1, choices=Gender.choices, blank=True)
    date_of_birth = models.DateField(null=True, blank=True)  # PII
    marital_status = models.CharField(max_length=10, choices=MaritalStatus.choices, blank=True)
    nationality = models.CharField(max_length=50, default="Indian")
    blood_group = models.CharField(max_length=5, blank=True)

    # Contact (PII)
    personal_email = models.EmailField(blank=True)  # PII
    work_email = models.EmailField(blank=True)
    phone = models.CharField(max_length=20, blank=True)  # PII
    emergency_contact_name = models.CharField(max_length=150, blank=True)
    emergency_contact_phone = models.CharField(max_length=20, blank=True)  # PII

    # Address (PII)
    current_address = models.TextField(blank=True)  # PII
    permanent_address = models.TextField(blank=True)  # PII

    # Identity documents (PII — encrypted in production)
    aadhaar_number = models.CharField(max_length=20, blank=True)  # PII
    pan_number = EncryptedCharField(max_length=20, blank=True)  # PII
    passport_number = models.CharField(max_length=20, blank=True)  # PII

    # Employment
    department = models.ForeignKey(
        "hrms.Department",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="employees",
    )
    designation = models.ForeignKey(
        "hrms.Designation",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="employees",
    )
    employment_type = models.CharField(max_length=15, choices=EmploymentType.choices, default=EmploymentType.FULL_TIME)
    employment_status = models.CharField(max_length=20, choices=EmploymentStatus.choices, default=EmploymentStatus.ACTIVE, db_index=True)
    
    # Shifts
    shift = models.ForeignKey('hrms.Shift', on_delete=models.SET_NULL, null=True, blank=True)

    # Dates
    date_of_joining = models.DateField(db_index=True)
    probation_end_date = models.DateField(null=True, blank=True)
    confirmation_date = models.DateField(null=True, blank=True)
    date_of_leaving = models.DateField(null=True, blank=True)
    resignation_date = models.DateField(null=True, blank=True)

    # Reporting
    reporting_manager_id = models.UUIDField(null=True, blank=True)  # FK to Employee

    # Compensation (PII)
    ctc = models.DecimalField(max_digits=12, decimal_places=2, default=0)  # Annual CTC
    basic_salary = models.DecimalField(max_digits=12, decimal_places=2, default=0)

    # Payroll Link
    salary_structure_id = models.UUIDField(null=True, blank=True)  # Soft FK to apps.payroll.models.SalaryStructure

    # Bank details (PII — encrypted)
    bank_name = models.CharField(max_length=100, blank=True)
    bank_account_number = EncryptedCharField(max_length=30, blank=True)  # PII
    bank_ifsc = models.CharField(max_length=15, blank=True)  # PII
    pf_number = models.CharField(max_length=30, blank=True)
    esi_number = models.CharField(max_length=30, blank=True)

    # Leave balance (denormalized — synced by leave service)
    leave_balance = models.JSONField(default=dict, blank=True)  # {"CASUAL": 12, "SICK": 7, ...}

    # Photo
    photo_url = models.URLField(blank=True, null=True)

    class Meta(TenantModel.Meta):
        db_table = "hrms_employees"
        unique_together = [("business_unit_id", "employee_code")]
        ordering = ["first_name", "last_name"]
        indexes = [
            models.Index(fields=["business_unit_id", "employment_status"]),
            models.Index(fields=["business_unit_id", "department"]),
            models.Index(fields=["user_id"]),
        ]

    def __str__(self) -> str:
        return f"{self.first_name} {self.last_name} ({self.employee_code})"

    @property
    def full_name(self) -> str:
        parts = [self.first_name, self.middle_name, self.last_name]
        return " ".join(p for p in parts if p)
