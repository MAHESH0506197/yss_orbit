# yss_orbit\backend\apps\attendance\tests\test_attendance_model.py
import pytest
from apps.attendance.tests.factories import ShiftFactory, AttendanceRecordFactory

@pytest.mark.django_db
def test_shift_creation():
    shift = ShiftFactory(name="Morning Shift")
    assert shift.name == "Morning Shift"
    assert shift.overnight_shift == False

@pytest.mark.django_db
def test_attendance_record_creation():
    record = AttendanceRecordFactory()
    assert record.status == "PRESENT"
