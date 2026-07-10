import random
import uuid
from decimal import Decimal
from datetime import date, timedelta
import calendar

from django.core.management.base import BaseCommand
from django.db import transaction

from apps.organization.models.organization_model import Organization
from apps.organization.models import BusinessUnit
from apps.hrms.models import Employee, Department, Designation, AttendanceRecord
from apps.payroll.models.tds_model import TDSSlab
from apps.payroll.models.salary_component_model import SalaryComponent, SalaryStructureComponent
from apps.payroll.models.salary_structure import SalaryStructure

class Command(BaseCommand):
    help = "Seed demo data for the Payroll module"

    def handle(self, *args, **options):
        self.stdout.write("Seeding payroll demo data...")

        with transaction.atomic():
            # 1. Organization & BU
            org, _ = Organization.objects.get_or_create(name="Global Corp")
            bu, _ = BusinessUnit.objects.get_or_create(name="India Operations", organization=org)
            self.stdout.write(f"Using Business Unit: {bu.name}")

            # 2. Departments & Designations
            deps = []
            for d in ["Engineering", "Sales", "Human Resources", "Finance"]:
                dep, _ = Department.objects.get_or_create(name=d, business_unit_id=bu.id)
                deps.append(dep)

            desigs = []
            for d in ["Associate", "Specialist", "Manager", "Director"]:
                desig, _ = Designation.objects.get_or_create(name=d, business_unit_id=bu.id)
                desigs.append(desig)

            # 3. TDS Slabs (FY 2026-27)
            TDSSlab.objects.filter(business_unit_id=bu.id, financial_year="2026-27").delete()
            TDSSlab.objects.create(business_unit_id=bu.id, financial_year="2026-27", min_income=Decimal("0"), max_income=Decimal("300000"), tax_rate=Decimal("0"))
            TDSSlab.objects.create(business_unit_id=bu.id, financial_year="2026-27", min_income=Decimal("300000"), max_income=Decimal("600000"), tax_rate=Decimal("5"), cess_rate=Decimal("4"))
            TDSSlab.objects.create(business_unit_id=bu.id, financial_year="2026-27", min_income=Decimal("600000"), max_income=Decimal("900000"), tax_rate=Decimal("10"), cess_rate=Decimal("4"))
            TDSSlab.objects.create(business_unit_id=bu.id, financial_year="2026-27", min_income=Decimal("900000"), max_income=Decimal("1200000"), tax_rate=Decimal("15"), cess_rate=Decimal("4"))
            TDSSlab.objects.create(business_unit_id=bu.id, financial_year="2026-27", min_income=Decimal("1200000"), max_income=Decimal("1500000"), tax_rate=Decimal("20"), cess_rate=Decimal("4"))
            TDSSlab.objects.create(business_unit_id=bu.id, financial_year="2026-27", min_income=Decimal("1500000"), tax_rate=Decimal("30"), cess_rate=Decimal("4"))

            # 4. Salary Components
            comp_hra, _ = SalaryComponent.objects.get_or_create(
                business_unit_id=bu.id, code="HRA", 
                defaults={"name": "House Rent Allowance", "component_type": "EARNING", "calculation_type": "PERCENTAGE_OF_BASIC", "value": Decimal("40"), "is_taxable": True}
            )
            comp_lta, _ = SalaryComponent.objects.get_or_create(
                business_unit_id=bu.id, code="LTA",
                defaults={"name": "Leave Travel Allowance", "component_type": "EARNING", "calculation_type": "FIXED", "value": Decimal("2500"), "is_taxable": True}
            )
            comp_medical, _ = SalaryComponent.objects.get_or_create(
                business_unit_id=bu.id, code="MED",
                defaults={"name": "Medical Allowance", "component_type": "EARNING", "calculation_type": "FIXED", "value": Decimal("1250"), "is_taxable": True}
            )

            # 5. Salary Structure
            struct, _ = SalaryStructure.objects.get_or_create(business_unit_id=bu.id, name="Standard Tier", defaults={"is_default": True})
            SalaryStructureComponent.objects.get_or_create(business_unit_id=bu.id, structure=struct, component=comp_hra)
            SalaryStructureComponent.objects.get_or_create(business_unit_id=bu.id, structure=struct, component=comp_lta)
            SalaryStructureComponent.objects.get_or_create(business_unit_id=bu.id, structure=struct, component=comp_medical)

            # 6. Employees (50)
            existing_count = Employee.objects.filter(business_unit_id=bu.id).count()
            if existing_count < 50:
                self.stdout.write("Generating 50 employees...")
                first_names = ["Aarav", "Vivaan", "Aditya", "Vihaan", "Arjun", "Sai", "Ayaan", "Krishna", "Ishaan", "Shaurya", "Diya", "Isha", "Ananya", "Aadhya", "Avni", "Kavya", "Saanvi", "Myra", "Aarohi", "Anika"]
                last_names = ["Patel", "Sharma", "Kumar", "Singh", "Reddy", "Rao", "Das", "Yadav", "Gupta", "Joshi"]
                
                for i in range(1, 51):
                    ctc = Decimal(random.randint(400000, 2500000))
                    basic = ctc * Decimal("0.40") / Decimal("12")  # Basic is 40% of CTC, monthly
                    
                    emp, created = Employee.objects.get_or_create(
                        employee_code=f"DEMO{i:03d}",
                        business_unit_id=bu.id,
                        defaults={
                            "first_name": random.choice(first_names),
                            "last_name": random.choice(last_names),
                            "work_email": f"demo{i}@globalcorp.com",
                            "employment_status": "ACTIVE",
                            "employment_type": "FULL_TIME",
                            "date_of_joining": "2023-01-15",
                            "department": random.choice(deps),
                            "designation": random.choice(desigs),
                            "ctc": ctc,
                            "basic_salary": basic,
                            "salary_structure_id": struct.id
                        }
                    )

            # 7. Attendance for May 2026
            year, month = 2026, 5
            _, num_days = calendar.monthrange(year, month)
            start_date = date(year, month, 1)
            
            self.stdout.write("Generating attendance for May 2026...")
            employees = Employee.objects.filter(business_unit_id=bu.id)
            
            # Fast bulk create
            attendance_to_create = []
            
            # Delete existing attendance for this period to avoid unique constraint errors
            AttendanceRecord.objects.filter(business_unit_id=bu.id, attendance_date__range=[start_date, date(year, month, num_days)]).delete()
            
            for emp in employees:
                # 10% chance this employee takes an unpaid leave this month
                has_lop = random.random() < 0.10
                lop_day = random.randint(1, 28) if has_lop else None
                
                for day in range(1, num_days + 1):
                    current_date = date(year, month, day)
                    is_weekend = current_date.weekday() >= 5
                    
                    status = "WEEKEND" if is_weekend else "PRESENT"
                    if not is_weekend and day == lop_day:
                        status = "UNPAID_LEAVE"
                        
                    attendance_to_create.append(
                        AttendanceRecord(
                            business_unit_id=bu.id,
                            employee=emp,
                            attendance_date=current_date,
                            status=status,
                            actual_in=None,
                            actual_out=None
                        )
                    )
            
            AttendanceRecord.objects.bulk_create(attendance_to_create, batch_size=1000)

        self.stdout.write(self.style.SUCCESS('Successfully seeded payroll data!'))
