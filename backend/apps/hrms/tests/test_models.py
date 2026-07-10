# yss_orbit\backend\apps\hrms\tests.py
import pytest
import uuid
from datetime import date
from django.db.utils import IntegrityError
from apps.hrms.models import Department, Designation, Employee

pytestmark = pytest.mark.django_db

@pytest.fixture
def business_unit_id():
    return uuid.uuid4()

@pytest.fixture
def department(business_unit_id):
    return Department.objects.create(
        business_unit_id=business_unit_id,
        name="Engineering",
        code="ENG"
    )

@pytest.fixture
def designation(business_unit_id, department):
    return Designation.objects.create(
        business_unit_id=business_unit_id,
        name="Software Engineer",
        code="SE1",
        department=department,
        level=1
    )

def test_create_department(business_unit_id):
    dept = Department.objects.create(
        business_unit_id=business_unit_id,
        name="Human Resources",
        code="HR"
    )
    assert dept.id is not None
    assert dept.name == "Human Resources"
    
    # Test unique constraint (business_unit_id, name)
    with pytest.raises(IntegrityError):
        Department.objects.create(
            business_unit_id=business_unit_id,
            name="Human Resources",
            code="HR2"
        )

def test_create_designation(business_unit_id, department):
    desig = Designation.objects.create(
        business_unit_id=business_unit_id,
        name="HR Manager",
        department=department,
        level=2
    )
    assert desig.id is not None
    assert desig.name == "HR Manager"
    assert desig.department == department

def test_create_employee(business_unit_id, department, designation):
    emp = Employee.objects.create(
        business_unit_id=business_unit_id,
        employee_code="EMP-001",
        first_name="John",
        last_name="Doe",
        gender=Employee.Gender.MALE,
        work_email="john.doe@example.com",
        department=department,
        designation=designation,
        employment_type=Employee.EmploymentType.FULL_TIME,
        employment_status=Employee.EmploymentStatus.ACTIVE,
        date_of_joining=date(2023, 1, 15)
    )
    
    assert emp.id is not None
    assert emp.full_name == "John Doe"
    assert emp.department == department
    assert emp.designation == designation
    assert emp.employee_code == "EMP-001"
    
    # Test unique constraint on business_unit_id + employee_code
    with pytest.raises(IntegrityError):
        Employee.objects.create(
            business_unit_id=business_unit_id,
            employee_code="EMP-001",
            first_name="Jane",
            last_name="Smith",
            date_of_joining=date(2023, 2, 1)
        )
