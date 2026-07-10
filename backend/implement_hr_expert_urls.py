# yss_orbit\backend\implement_hr_expert_urls.py
import os

base_dir = r"c:\PROJECT\yss_orbit\backend\apps"

APPS_URLS = {
    "attendance": """
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .api.views.attendance_view import AttendanceLogViewSet, DailyAttendanceViewSet

router = DefaultRouter()
router.register(r'logs', AttendanceLogViewSet, basename='attendance-log')
router.register(r'daily', DailyAttendanceViewSet, basename='daily-attendance')

urlpatterns = [
    path('', include(router.urls)),
]
""",
    "leave_management": """
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .api.views.leave_view import LeaveTypeViewSet, LeaveBalanceViewSet, LeaveApplicationViewSet

router = DefaultRouter()
router.register(r'types', LeaveTypeViewSet, basename='leave-type')
router.register(r'balances', LeaveBalanceViewSet, basename='leave-balance')
router.register(r'applications', LeaveApplicationViewSet, basename='leave-application')

urlpatterns = [
    path('', include(router.urls)),
]
""",
    "payroll": """
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .api.views.payroll_view import PayrollRunViewSet, PayslipViewSet, PayrollLedgerViewSet

router = DefaultRouter()
router.register(r'runs', PayrollRunViewSet, basename='payroll-run')
router.register(r'payslips', PayslipViewSet, basename='payslip')
router.register(r'ledgers', PayrollLedgerViewSet, basename='payroll-ledger')

urlpatterns = [
    path('', include(router.urls)),
]
""",
    "hrms": """
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .api.views.employee_view import EmployeeViewSet

router = DefaultRouter()
router.register(r'employees', EmployeeViewSet, basename='employee')

urlpatterns = [
    path('', include(router.urls)),
]
""",
    "recruitment": """
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .api.views.recruitment_view import JobPostingViewSet, ApplicantViewSet, InterviewViewSet

router = DefaultRouter()
router.register(r'jobs', JobPostingViewSet, basename='job-posting')
router.register(r'applicants', ApplicantViewSet, basename='applicant')
router.register(r'interviews', InterviewViewSet, basename='interview')

urlpatterns = [
    path('', include(router.urls)),
]
"""
}

for app_name, url_content in APPS_URLS.items():
    app_dir = os.path.join(base_dir, app_name)
    url_path = os.path.join(app_dir, "urls.py")
    with open(url_path, "w") as f:
        f.write(url_content.strip() + "\\n")
    print(f"Wrote {url_path}")

print("Done URLs!")
