import os
import subprocess
from collections import defaultdict

def grep(term):
    cmd = f'git grep -l "{term}" -- "*.py"'
    try:
        output = subprocess.check_output(cmd, shell=True, text=True)
        return [f for f in output.strip().split('\n') if f]
    except subprocess.CalledProcessError:
        return []

checks = {
    "PayrollService": "PayrollService",
    "LeaveService": "LeaveService",
    "AttendanceService": "AttendanceService",
    "AttendanceCorrectionRequest": "AttendanceCorrectionRequest",
    "AttendanceWidget": "AttendanceWidget",
    "Reports (HRAnalytics)": "HRAnalyticsSnapshot",
}

print("=== Cross-Domain Usage Audit ===")
for service, term in checks.items():
    files = grep(term)
    print(f"\n{service} ({term}) is found in:")
    for f in files:
        print(f"  - {f}")

print("\n=== Model Def Location ===")
for model in ["AttendanceRecord", "AttendanceLog", "AttendancePunch", "Shift", "LeaveRequest", "LeaveApplication", "EmployeeAppraisal", "KPI"]:
    files = grep(f"class {model}(")
    print(f"Model {model} defined in:")
    for f in files:
        print(f"  - {f}")
