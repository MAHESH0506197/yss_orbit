from django.db import models
from apps.platform.models.base import TenantModel


class EmployeeTaxDeclaration(TenantModel):
    """
    Annual Income Tax declaration per employee per financial year.
    Supports both Old Regime (with exemptions/deductions) and New Regime
    (lower slabs, fewer deductions).
    Used by SalaryComputationService to calculate monthly TDS.
    """

    class TaxRegime(models.TextChoices):
        OLD_REGIME = 'OLD_REGIME', 'Old Regime'
        NEW_REGIME = 'NEW_REGIME', 'New Regime (Default FY2024-25)'

    class Status(models.TextChoices):
        DRAFT = 'DRAFT', 'Draft'
        SUBMITTED = 'SUBMITTED', 'Submitted'
        VERIFIED = 'VERIFIED', 'Verified by HR'
        LOCKED = 'LOCKED', 'Locked for Payroll'

    employee_id = models.UUIDField(db_index=True)  # Soft FK to hrms.Employee
    financial_year = models.CharField(max_length=9, db_index=True)  # e.g. '2024-25'
    tax_regime = models.CharField(
        max_length=15, choices=TaxRegime.choices, default=TaxRegime.NEW_REGIME
    )
    status = models.CharField(
        max_length=15, choices=Status.choices, default=Status.DRAFT
    )

    # Old Regime: Chapter VI-A Deductions
    section_80c = models.DecimalField(
        max_digits=12, decimal_places=2, default=0
    )  # PF + LIC + ELSS (max ₹1.5L)
    section_80d = models.DecimalField(
        max_digits=12, decimal_places=2, default=0
    )  # Medical insurance premiums
    section_80e = models.DecimalField(
        max_digits=12, decimal_places=2, default=0
    )  # Education loan interest
    section_80g = models.DecimalField(
        max_digits=12, decimal_places=2, default=0
    )  # Eligible donations
    section_80tta = models.DecimalField(
        max_digits=12, decimal_places=2, default=0
    )  # Savings account interest (max ₹10K)

    # Old Regime: Exemptions
    hra_exemption = models.DecimalField(
        max_digits=12, decimal_places=2, default=0
    )
    lta_exemption = models.DecimalField(
        max_digits=12, decimal_places=2, default=0
    )
    other_exemptions = models.DecimalField(
        max_digits=12, decimal_places=2, default=0
    )

    # Computed totals (auto-calculated on save/verification)
    total_declared_deductions = models.DecimalField(
        max_digits=12, decimal_places=2, default=0
    )
    total_exemptions = models.DecimalField(
        max_digits=12, decimal_places=2, default=0
    )
    estimated_annual_tax = models.DecimalField(
        max_digits=12, decimal_places=2, default=0
    )
    monthly_tds = models.DecimalField(
        max_digits=12, decimal_places=2, default=0
    )

    verified_by_id = models.UUIDField(null=True, blank=True)  # Soft FK to iam.User
    verified_at = models.DateTimeField(null=True, blank=True)
    submitted_at = models.DateTimeField(null=True, blank=True)
    locked_at = models.DateTimeField(null=True, blank=True)

    class Meta(TenantModel.Meta):
        db_table = 'payroll_tax_declarations'
        unique_together = [('business_unit_id', 'employee_id', 'financial_year')]
        indexes = [
            models.Index(
                fields=['business_unit_id', 'financial_year', 'status']
            ),
        ]

    def __str__(self):
        return (
            f"Tax Declaration {self.employee_id} "
            f"FY{self.financial_year} [{self.tax_regime}/{self.status}]"
        )


class InvestmentProofSubmission(TenantModel):
    """
    Investment proof documents submitted by an employee to support their tax declaration.
    HR verifies proofs before locking the declaration for payroll processing.
    """

    class ProofType(models.TextChoices):
        LIC = 'LIC', 'LIC Premium'
        PPF = 'PPF', 'PPF Receipt'
        ELSS = 'ELSS', 'ELSS Statement'
        NSC = 'NSC', 'NSC Certificate'
        NPS = 'NPS', 'NPS Contribution'
        EPF = 'EPF', 'EPF Contribution'
        HOME_LOAN = 'HOME_LOAN', 'Home Loan Statement'
        TUITION = 'TUITION', 'Tuition Fee Receipt'
        HEALTH_INS = 'HEALTH_INS', 'Health Insurance Premium'
        DONATION = 'DONATION', 'Donation Receipt 80G'
        HRA_RENT = 'HRA_RENT', 'Rent Receipts for HRA'
        LTA = 'LTA', 'LTA Travel Bills'
        OTHER = 'OTHER', 'Other'

    class Status(models.TextChoices):
        PENDING = 'PENDING', 'Pending'
        SUBMITTED = 'SUBMITTED', 'Submitted'
        VERIFIED = 'VERIFIED', 'Verified'
        REJECTED = 'REJECTED', 'Rejected'

    declaration = models.ForeignKey(
        EmployeeTaxDeclaration,
        on_delete=models.CASCADE,
        related_name='proofs',
    )
    proof_type = models.CharField(max_length=30, choices=ProofType.choices)
    declared_amount = models.DecimalField(max_digits=12, decimal_places=2)
    submitted_amount = models.DecimalField(
        max_digits=12, decimal_places=2, default=0
    )
    file_asset_id = models.UUIDField(
        null=True, blank=True
    )  # Soft FK to file_storage.FileAsset
    status = models.CharField(
        max_length=15, choices=Status.choices, default=Status.PENDING
    )
    remarks = models.TextField(blank=True)
    verified_by_id = models.UUIDField(null=True, blank=True)  # Soft FK to iam.User
    verified_at = models.DateTimeField(null=True, blank=True)

    class Meta(TenantModel.Meta):
        db_table = 'payroll_investment_proof_submissions'

    def __str__(self):
        return (
            f"{self.proof_type}: Declared={self.declared_amount}, "
            f"Submitted={self.submitted_amount} [{self.status}]"
        )
