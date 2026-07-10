import uuid
from decimal import Decimal
from datetime import date
from django.db import transaction
from django.db.models import QuerySet

from apps.hrms.models import LeaveType, LeaveBalance, Employee


class LeaveAllocationService:
    """
    Handles Leave Balance allocation, accrual, proration, and adjustments.
    """

    @classmethod
    def calculate_prorated_opening_balance(cls, total_allocation: Decimal, join_date: date, year: int) -> Decimal:
        """
        Calculates prorated leave based on join date.
        If joined in July, gets ~6 months worth of leave.
        """
        if join_date.year < year:
            return total_allocation
        if join_date.year > year:
            return Decimal("0.00")
            
        months_worked = 12 - join_date.month + 1
        prorated = (total_allocation / Decimal("12.00")) * Decimal(str(months_worked))
        return round(prorated, 2)

    @classmethod
    @transaction.atomic
    def allocate_year_opening(cls, bu_id: uuid.UUID, year: int) -> int:
        """
        Allocates opening balances for all active employees for the given year.
        """
        employees = Employee.objects.filter(business_unit_id=bu_id, employment_status=Employee.EmploymentStatus.ACTIVE)
        leave_types = LeaveType.objects.filter(business_unit_id=bu_id, is_active=True)
        
        count = 0
        for emp in employees:
            for lt in leave_types:
                # Find or create balance
                balance, created = LeaveBalance.objects.get_or_create(
                    business_unit_id=bu_id,
                    employee=emp,
                    leave_type=lt,
                    year=year,
                    defaults={
                        'opening_balance': Decimal("0.00")
                    }
                )
                
                # If created, assign opening balance based on accrual rate * 12 (if given upfront)
                # Or wait for monthly accrual if accrual_rate_per_month is used.
                if created and lt.accrual_rate_per_month == Decimal("0.00"):
                    # Assuming some max_days_per_year logic, but for now we'll just leave it 0
                    # and rely on policies to set the base.
                    pass
                
                count += 1
                
        return count

    @classmethod
    def recalculate_closing_balance(cls, balance: LeaveBalance) -> None:
        """
        Dynamically calculates and saves the closing balance.
        """
        balance.closing_balance = (
            balance.opening_balance + 
            balance.accrued_days + 
            balance.adjusted_days - 
            balance.consumed_days - 
            balance.encashed_days
        )
        balance.save(update_fields=['closing_balance'])
