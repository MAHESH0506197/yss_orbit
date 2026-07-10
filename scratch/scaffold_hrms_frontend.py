import os

pages = {
    "EmployeeListPage.tsx": """import React from 'react';

export const EmployeeListPage: React.FC = () => {
    return (
        <div>
            <h1>Employee List</h1>
            <p>Search, filter (dept/designation/status), and pagination.</p>
        </div>
    );
};
""",
    "EmployeeProfilePage.tsx": """import React from 'react';

export const EmployeeProfilePage: React.FC = () => {
    return (
        <div>
            <h1>Employee Profile</h1>
            <p>Tabs: Personal, Professional, Documents, Bank, History.</p>
        </div>
    );
};
""",
    "EmployeeFormPage.tsx": """import React from 'react';

export const EmployeeFormPage: React.FC = () => {
    return (
        <div>
            <h1>Employee Form</h1>
            <p>Create/edit form with all fields, validation, and auto-generated emp_code.</p>
        </div>
    );
};
""",
    "OnboardingPage.tsx": """import React from 'react';

export const OnboardingPage: React.FC = () => {
    return (
        <div>
            <h1>Onboarding</h1>
            <p>Step-by-step progress and job polling.</p>
        </div>
    );
};
""",
    "OffboardingPage.tsx": """import React from 'react';

export const OffboardingPage: React.FC = () => {
    return (
        <div>
            <h1>Offboarding</h1>
            <p>Confirmation steps and reason capture.</p>
        </div>
    );
};
""",
    "DepartmentManagementPage.tsx": """import React from 'react';

export const DepartmentManagementPage: React.FC = () => {
    return (
        <div>
            <h1>Department Management</h1>
            <p>Department tree management.</p>
        </div>
    );
};
""",
    "DesignationManagementPage.tsx": """import React from 'react';

export const DesignationManagementPage: React.FC = () => {
    return (
        <div>
            <h1>Designation Management</h1>
            <p>Designation management.</p>
        </div>
    );
};
""",
    "OrgChartPage.tsx": """import React from 'react';

export const OrgChartPage: React.FC = () => {
    return (
        <div>
            <h1>Organization Chart</h1>
            <p>Zoomable tree, export as image.</p>
        </div>
    );
};
"""
}

base_dir = r"c:\PROJECT\yss_orbit\frontend\src\modules\hrms\pages"
for filename, content in pages.items():
    filepath = os.path.join(base_dir, filename)
    with open(filepath, "w") as f:
        f.write(content)

print("Scaffolded HRMS frontend pages successfully.")
