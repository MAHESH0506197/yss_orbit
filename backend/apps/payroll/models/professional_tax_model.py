from django.db import models
from apps.platform.models.base import TenantModel


class ProfessionalTaxSlab(TenantModel):
    """
    State-wise Professional Tax (PT) slabs.
    PT is a state-level statutory deduction on salary.
    Each state defines income ranges and corresponding monthly PT amounts.
    """

    STATE_CODES = [
        ('KA', 'Karnataka'),
        ('MH', 'Maharashtra'),
        ('WB', 'West Bengal'),
        ('AP', 'Andhra Pradesh'),
        ('TS', 'Telangana'),
        ('TN', 'Tamil Nadu'),
        ('GJ', 'Gujarat'),
        ('MP', 'Madhya Pradesh'),
        ('OR', 'Odisha'),
        ('AS', 'Assam'),
        ('KL', 'Kerala'),
        ('MN', 'Manipur'),
        ('ME', 'Meghalaya'),
        ('MZ', 'Mizoram'),
        ('SK', 'Sikkim'),
        ('NA', 'Not Applicable'),
    ]

    state_code = models.CharField(max_length=5, choices=STATE_CODES, db_index=True)
    financial_year = models.CharField(max_length=9)  # e.g. '2024-25'
    salary_from = models.DecimalField(max_digits=12, decimal_places=2)  # Monthly gross from
    salary_to = models.DecimalField(
        max_digits=12, decimal_places=2, null=True, blank=True
    )  # null = above threshold
    monthly_pt_amount = models.DecimalField(max_digits=12, decimal_places=2)  # PT amount in INR
    is_active = models.BooleanField(default=True)

    class Meta(TenantModel.Meta):
        db_table = 'payroll_professional_tax_slabs'
        ordering = ['state_code', 'salary_from']

    def __str__(self):
        return (
            f"{self.state_code}: {self.salary_from}-{self.salary_to or 'above'} "
            f"= ₹{self.monthly_pt_amount}/mo"
        )


class GratuityConfig(TenantModel):
    """
    Gratuity calculation config per BU.
    Formula: (Basic Salary × 15 × Years of Service) / 26.
    Mandatory for employees completing 5+ years of continuous service
    under the Payment of Gratuity Act, 1972.
    """

    eligibility_years = models.DecimalField(
        max_digits=4, decimal_places=1, default=5.0
    )  # Minimum years to qualify
    rate_per_year = models.DecimalField(
        max_digits=5, decimal_places=2, default=15.0
    )  # 15 days per year
    working_days_divisor = models.IntegerField(default=26)  # 26 per Gratuity Act
    max_gratuity_amount = models.DecimalField(
        max_digits=12, decimal_places=2, default=2000000.00
    )  # Statutory cap of ₹20L
    is_active = models.BooleanField(default=True)

    class Meta(TenantModel.Meta):
        db_table = 'payroll_gratuity_config'

    def __str__(self):
        return (
            f"Gratuity Config [{self.business_unit_id}]: "
            f"{self.rate_per_year} days/year, min {self.eligibility_years} yrs"
        )


class StatutoryBonusConfig(TenantModel):
    """
    Statutory Bonus config per BU (Payment of Bonus Act, 1965).
    Minimum 8.33% of basic or Rs 100 (whichever is higher), max 20% for eligible employees.
    Employees eligible if basic salary <= Rs 21,000/month.
    """

    min_bonus_pct = models.DecimalField(
        max_digits=5, decimal_places=2, default=8.33
    )  # Minimum 8.33%
    max_bonus_pct = models.DecimalField(
        max_digits=5, decimal_places=2, default=20.00
    )  # Maximum 20%
    salary_ceiling = models.DecimalField(
        max_digits=12, decimal_places=2, default=21000.00
    )  # ₹21,000 eligibility cap
    bonus_calculation_ceiling = models.DecimalField(
        max_digits=12, decimal_places=2, default=7000.00
    )  # Bonus computed on max ₹7,000
    financial_year = models.CharField(max_length=9)  # e.g. '2024-25'
    is_active = models.BooleanField(default=True)

    class Meta(TenantModel.Meta):
        db_table = 'payroll_statutory_bonus_config'

    def __str__(self):
        return (
            f"Bonus Config {self.financial_year}: "
            f"{self.min_bonus_pct}%-{self.max_bonus_pct}%"
        )


class LabourWelfareFundConfig(TenantModel):
    """
    Labour Welfare Fund (LWF) config per BU.
    State-specific biannual/annual statutory contribution split between
    employer and employee.
    """

    class Frequency(models.TextChoices):
        MONTHLY = 'MONTHLY', 'Monthly'
        BIANNUAL = 'BIANNUAL', 'Bi-Annual'
        ANNUAL = 'ANNUAL', 'Annual'

    state_code = models.CharField(max_length=5, db_index=True)
    employee_contribution = models.DecimalField(
        max_digits=12, decimal_places=2, default=0.00
    )
    employer_contribution = models.DecimalField(
        max_digits=12, decimal_places=2, default=0.00
    )
    frequency = models.CharField(
        max_length=20, choices=Frequency.choices, default=Frequency.BIANNUAL
    )
    is_active = models.BooleanField(default=True)

    class Meta(TenantModel.Meta):
        db_table = 'payroll_lwf_config'

    def __str__(self):
        return (
            f"LWF {self.state_code}: "
            f"Emp={self.employee_contribution}, Empr={self.employer_contribution}"
        )


class MinimumWageConfig(TenantModel):
    """
    Minimum Wage config per state and worker category.
    Used to validate that net salary does not fall below the statutory minimum
    as mandated by the Minimum Wages Act, 1948.
    """

    class WorkerCategory(models.TextChoices):
        UNSKILLED = 'UNSKILLED', 'Unskilled'
        SEMI_SKILLED = 'SEMI_SKILLED', 'Semi-Skilled'
        SKILLED = 'SKILLED', 'Skilled'
        HIGHLY_SKILLED = 'HIGHLY_SKILLED', 'Highly Skilled'

    state_code = models.CharField(max_length=5, db_index=True)
    worker_category = models.CharField(
        max_length=30, choices=WorkerCategory.choices
    )
    daily_wage = models.DecimalField(max_digits=12, decimal_places=2)
    monthly_wage = models.DecimalField(max_digits=12, decimal_places=2)
    effective_from = models.DateField()
    effective_to = models.DateField(null=True, blank=True)
    is_active = models.BooleanField(default=True)

    class Meta(TenantModel.Meta):
        db_table = 'payroll_minimum_wage_config'

    def __str__(self):
        return (
            f"Min Wage {self.state_code}/{self.worker_category}: "
            f"₹{self.monthly_wage}/mo"
        )
