from django.db import models
from apps.platform.models.base import TenantModel

class Payslip(TenantModel):
    class Status(models.TextChoices):
        DRAFT = 'DRAFT', 'Draft'
        GENERATED = 'GENERATED', 'Generated'
        PAID = 'PAID', 'Paid'

    class PaymentMode(models.TextChoices):
        BANK_TRANSFER = 'BANK_TRANSFER', 'Bank Transfer'
        CHEQUE = 'CHEQUE', 'Cheque'
        CASH = 'CASH', 'Cash'

    payroll_run = models.ForeignKey('PayrollRun', on_delete=models.CASCADE, related_name='payslips', null=True, blank=True)
    employee_id = models.UUIDField(db_index=True, null=True, blank=True)
    employee_code = models.CharField(max_length=50, blank=True)
    employee_name = models.CharField(max_length=255, blank=True)
    salary_structure_id = models.UUIDField(null=True, blank=True)
    
    month = models.IntegerField(default=1)
    year = models.IntegerField(default=2024)
    payment_mode = models.CharField(max_length=50, choices=PaymentMode.choices, default=PaymentMode.BANK_TRANSFER)
    payment_date = models.DateField(null=True, blank=True)
    
    # Attendance Metrics
    working_days = models.DecimalField(max_digits=5, decimal_places=2, default=0.00)
    paid_days = models.DecimalField(max_digits=5, decimal_places=2, default=0.00)
    lop_days = models.DecimalField(max_digits=5, decimal_places=2, default=0.00)
    
    # Financial Totals
    basic_salary = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    gross_salary = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    total_earnings = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    total_deductions = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    net_salary = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    
    # Statutory Deductions
    employee_pf = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    employer_pf = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    employee_esi = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    employer_esi = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    tds = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    
    # Detailed Breakdowns
    earnings_breakdown = models.JSONField(default=dict, blank=True)
    deductions_breakdown = models.JSONField(default=dict, blank=True)
    
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.DRAFT)

    class Meta:
        db_table = 'payroll_payslip'
        indexes = [
            models.Index(fields=['business_unit_id', 'employee_id'], name='payslip_bu_emp_idx'),
            models.Index(fields=['business_unit_id', 'year', 'month'], name='payslip_bu_period_idx'),
            models.Index(fields=['business_unit_id', 'status'], name='payslip_bu_status_idx'),
            models.Index(fields=['business_unit_id', 'payroll_run_id'], name='payslip_bu_run_idx'),
        ]

    def __str__(self):
        return f"Payslip {self.id} for {self.employee_name}"
