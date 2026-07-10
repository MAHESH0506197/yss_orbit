import os
from pathlib import Path

files_to_fix = [
    r"c:\PROJECT\yss_orbit\frontend\src\pages\hrms\HRMSPortalPage.tsx",
    r"c:\PROJECT\yss_orbit\frontend\src\pages\integration\integrationListPage.tsx",
    r"c:\PROJECT\yss_orbit\frontend\src\pages\leaveManagement\leaveManagementListPage.tsx",
    r"c:\PROJECT\yss_orbit\frontend\src\pages\observability\observabilityListPage.tsx",
    r"c:\PROJECT\yss_orbit\frontend\src\pages\payroll\components\PayrollRunTable.tsx",
    r"c:\PROJECT\yss_orbit\frontend\src\pages\payroll\components\PayslipModal.tsx",
    r"c:\PROJECT\yss_orbit\frontend\src\pages\pharmacy\PharmacyDashboardPage.tsx",
    r"c:\PROJECT\yss_orbit\frontend\src\pages\platformAdmin\components\TenantTable.tsx",
    r"c:\PROJECT\yss_orbit\frontend\src\pages\pos\posListPage.tsx",
    r"c:\PROJECT\yss_orbit\frontend\src\pages\pos\POSTerminalPage.tsx",
    r"c:\PROJECT\yss_orbit\frontend\src\pages\recruitment\recruitmentListPage.tsx",
    r"c:\PROJECT\yss_orbit\frontend\src\pages\reporting\reportingListPage.tsx",
    r"c:\PROJECT\yss_orbit\frontend\src\pages\stockTransfer\stockTransferListPage.tsx"
]

def fix_jsx():
    for file_path in files_to_fix:
        try:
            with open(file_path, "r", encoding="utf-8") as f:
                lines = f.readlines()
                
            new_lines = []
            for line in lines:
                if "// @ts-expect-error - Auto-patched" not in line and "{/* @ts-expect-error - Auto-patched */}" not in line:
                    new_lines.append(line)
                    
            with open(file_path, "w", encoding="utf-8") as f:
                f.writelines(new_lines)
        except Exception as e:
            pass

if __name__ == "__main__":
    fix_jsx()
