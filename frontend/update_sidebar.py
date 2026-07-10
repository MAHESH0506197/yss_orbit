import re
from pathlib import Path

sidebar_path = Path('C:/PROJECT/yss_orbit/frontend/src/components/layouts/sidebar/Sidebar.tsx')
content = sidebar_path.read_text(encoding='utf-8')

new_navigation = """const NAVIGATION: NavGroup[] = [
  {
    name: 'MY WORKSPACE',
    subGroups: [
      { name: 'My Workspace', items: [
        { name: 'My Attendance',   path: '/workspace/my-attendance',   icon: <FcClock size={17}/>,             module: 'MODULE_ATTENDANCE', feature: 'FEATURE_MY_ATTENDANCE' },
        { name: 'My Leave',        path: '/workspace/my-leave',        icon: <FcCalendar size={17}/>,          module: 'MODULE_LEAVE', feature: 'FEATURE_MY_LEAVE' },
        { name: 'My Payslips',     path: '/workspace/my-payslips',     icon: <FcDataSheet size={17}/>,         module: 'MODULE_PAYROLL', feature: 'FEATURE_MY_PAYSLIPS' },
        { name: 'My Appraisals',   path: '/workspace/my-appraisals',   icon: <FcSalesPerformance size={17}/>,  module: 'MODULE_APPRAISAL', feature: 'FEATURE_MY_APPRAISALS' },
      ]},
      { name: 'Team Workspace', items: [
        { name: 'Team Attendance', path: '/workspace/team-attendance', icon: <FcOvertime size={17}/>,          module: 'MODULE_ATTENDANCE', feature: 'FEATURE_TEAM_ATTENDANCE' },
        { name: 'Team Leave',      path: '/workspace/team-leave',      icon: <FcCalendar size={17}/>,          module: 'MODULE_LEAVE', feature: 'FEATURE_TEAM_LEAVE' },
        { name: 'Team Appraisals', path: '/workspace/team-appraisals', icon: <FcManager size={17}/>,           module: 'MODULE_APPRAISAL', feature: 'FEATURE_TEAM_APPRAISALS' },
      ]}
    ]
  },
  {
    name: 'HR',
    subGroups: [
      { name: 'Core HRMS', items: [
        { name: 'HRMS Dashboard',  path: '/hrms/dashboard',       icon: <FcComboChart size={17}/>,    module: 'MODULE_HRMS', feature: 'FEATURE_HRMS_DASHBOARD' },
        { name: 'Departments',     path: '/hrms/departments',     icon: <FcDepartment size={17}/>,    module: 'MODULE_HRMS', feature: 'FEATURE_DEPARTMENTS' },
        { name: 'Designations',    path: '/hrms/designations',    icon: <FcRating size={17}/>,        module: 'MODULE_HRMS', feature: 'FEATURE_DESIGNATIONS' },
        { name: 'Employees',       path: '/hrms/employees',       icon: <FcManager size={17}/>,       module: 'MODULE_HRMS', feature: 'FEATURE_EMPLOYEE_DIRECTORY' },
        { name: 'Employee 360°',   path: '/hrms/employee-360',    icon: <FcConferenceCall size={17}/>,module: 'MODULE_HRMS', feature: 'FEATURE_EMPLOYEE_360' },
        { name: 'Organization Chart', path: '/hrms/org-chart',    icon: <FcGenealogy size={17}/>,     module: 'MODULE_HRMS', feature: 'FEATURE_ORG_CHART' },
        { name: 'Onboarding',      path: '/hrms/lifecycle/onboarding', icon: <FcOk size={17}/>,       module: 'MODULE_HRMS', feature: 'FEATURE_ONBOARDING' },
        { name: 'Assets',          path: '/hrms/lifecycle/assets',     icon: <FcPackage size={17}/>,  module: 'MODULE_HRMS', feature: 'FEATURE_ASSETS' },
        { name: 'Offboarding',     path: '/hrms/lifecycle/offboarding',icon: <FcBusinessman size={17}/>,module: 'MODULE_HRMS', feature: 'FEATURE_OFFBOARDING' },
      ]},
      { name: 'Recruitment', items: [
        { name: 'Job Postings',    path: '/hrms/recruitment/jobs',icon: <FcBriefcase size={17}/>,     module: 'MODULE_RECRUITMENT', feature: 'FEATURE_JOB_POSTINGS' },
        { name: 'Candidates',      path: '/hrms/recruitment/candidates', icon: <FcConferenceCall size={17}/>, module: 'MODULE_RECRUITMENT', feature: 'FEATURE_CANDIDATES' },
        { name: 'Interviews',      path: '/hrms/recruitment/interviews', icon: <FcCalendar size={17}/>,       module: 'MODULE_RECRUITMENT', feature: 'FEATURE_INTERVIEWS' },
      ]},
      { name: 'Attendance', items: [
        { name: 'Shifts',          path: '/hrms/shifts',          icon: <FcOvertime size={17}/>,      module: 'MODULE_ATTENDANCE', feature: 'FEATURE_SHIFTS' },
        { name: 'Shift Planning',  path: '/hrms/shift-planning',  icon: <FcList size={17}/>,          module: 'MODULE_ATTENDANCE', feature: 'FEATURE_SHIFT_PLANNING' },
        { name: 'Attendance Dashboard', path: '/hrms/attendance', icon: <FcClock size={17}/>,         module: 'MODULE_ATTENDANCE', feature: 'FEATURE_ATTENDANCE_DASHBOARD' },
      ]},
      { name: 'Leave', items: [
        { name: 'Holidays',        path: '/hrms/holidays',        icon: <FcInfo size={17}/>,          module: 'MODULE_LEAVE', feature: 'FEATURE_HOLIDAYS' },
        { name: 'Leave Management',path: '/hrms/leave',           icon: <FcCalendar size={17}/>,      module: 'MODULE_LEAVE', feature: 'FEATURE_LEAVE_MANAGEMENT' },
      ]},
      { name: 'Payroll', items: [
        { name: 'Salary Structures',path: '/hrms/payroll/structures', icon: <FcBarChart size={17}/>,  module: 'MODULE_PAYROLL', feature: 'FEATURE_SALARY_STRUCTURES' },
        { name: 'IT Declarations', path: '/hrms/payroll/it',      icon: <FcSalesPerformance size={17}/>,module: 'MODULE_PAYROLL', feature: 'FEATURE_IT_DECLARATIONS' },
        { name: 'Payroll Dashboard',path: '/hrms/payroll/dashboard',  icon: <FcMoneyTransfer size={17}/>,module: 'MODULE_PAYROLL', feature: 'FEATURE_PAYROLL_DASHBOARD' },
        { name: 'Payslips',        path: '/hrms/payroll/payslips',icon: <FcDataSheet size={17}/>,     module: 'MODULE_PAYROLL', feature: 'FEATURE_PAYSLIPS' },
        { name: 'Compliance',      path: '/hrms/payroll/compliance',icon: <FcOk size={17}/>,          module: 'MODULE_PAYROLL', feature: 'FEATURE_PAYROLL_COMPLIANCE' },
      ]},
      { name: 'Performance', items: [
        { name: 'Goals',           path: '/hrms/performance/goals',icon: <FcBookmark size={17}/>,     module: 'MODULE_APPRAISAL', feature: 'FEATURE_GOALS' },
        { name: 'Appraisal Cycles',path: '/hrms/performance/cycles',icon: <FcRating size={17}/>,      module: 'MODULE_APPRAISAL', feature: 'FEATURE_APPRAISAL_CYCLES' },
        { name: 'Reviews',         path: '/hrms/performance/reviews',icon: <FcInspection size={17}/>, module: 'MODULE_APPRAISAL', feature: 'FEATURE_REVIEWS' },
      ]},
    ]
  },
  {
    name: 'SETUP',
    subGroups: [
      { name: 'Organization', items: [
        { name: 'Organizations',   path: '/platform/organizations',    icon: <FcOrganization size={17}/>, module: 'MODULE_ORGANIZATION', feature: 'FEATURE_ORGANIZATIONS', superAdminOnly: true },
        { name: 'Business Domains',path: '/platform/business-domains', icon: <FcGlobe size={17}/>,    module: 'MODULE_ORGANIZATION', feature: 'FEATURE_BUSINESS_DOMAINS', superAdminOnly: true },
        { name: 'Business Units',  path: '/platform/business-units',   icon: <FcDepartment size={17}/>, module: 'MODULE_ORGANIZATION', feature: 'FEATURE_BUSINESS_UNITS', superAdminOnly: true },
      ]},
      { name: 'Platform Configurations', items: [
        { name: 'Branding',        path: '/platform/branding',         icon: <FcSettings size={17}/>,         module: 'MODULE_PLATFORM', feature: 'FEATURE_BRANDING', superAdminOnly: true },
        { name: 'Module Registry', path: '/platform/module-registry',  icon: <FcPackage size={17}/>,          superAdminOnly: true },
        { name: 'Subscriptions',   path: '/platform/subscriptions',    icon: <FcCurrencyExchange size={17}/>, module: 'MODULE_TENANCY', feature: 'FEATURE_SUBSCRIPTIONS', superAdminOnly: true },
        { name: 'Tenant Settings', path: '/platform/tenant-settings',  icon: <FcSettings size={17}/>, module: 'MODULE_TENANCY', feature: 'FEATURE_TENANT_SETTINGS', superAdminOnly: true },
      ]},
      { name: 'IAM', items: [
        { name: 'Users Management',    path: '/platform/users',               icon: <FcConferenceCall size={17}/>, module: 'MODULE_IAM', feature: 'FEATURE_USERS_MANAGEMENT', superAdminOnly: true },
        { name: 'Roles Management',    path: '/platform/roles',               icon: <FcPrivacy size={17}/>,   module: 'MODULE_IAM', feature: 'FEATURE_ROLES_MANAGEMENT', superAdminOnly: true },
        { name: 'Permission Registry', path: '/platform/permission-registry', icon: <FcList size={17}/>,      module: 'MODULE_IAM', feature: 'FEATURE_PERMISSION_REGISTRY', superAdminOnly: true },
      ]}
    ]
  },
  {
    name: 'DAILY OPERATIONS',
    subGroups: [
      { name: 'Platform Data', items: [
        { name: 'File Storage',    path: '/platform/file-storage',     icon: <FcDataSheet size={17}/>,        module: 'MODULE_PLATFORM', feature: 'FEATURE_FILE_STORAGE', superAdminOnly: true },
      ]},
      { name: 'Background Processing', items: [
        { name: 'Jobs Dashboard',  path: '/platform/jobs',             icon: <FcSettings size={17}/>,         module: 'MODULE_PLATFORM', feature: 'FEATURE_JOBS', superAdminOnly: true },
      ]}
    ]
  },
  {
    name: 'MONITORING',
    subGroups: [
      { name: 'Observability', items: [
        { name: 'Health',          path: '/platform/health',           icon: <FcOk size={17}/>,               module: 'MODULE_OBSERVABILITY', feature: 'FEATURE_HEALTH', superAdminOnly: true },
        { name: 'Metrics',         path: '/platform/metrics',          icon: <FcComboChart size={17}/>,       module: 'MODULE_OBSERVABILITY', feature: 'FEATURE_METRICS', superAdminOnly: true },
        { name: 'API Keys',        path: '/platform/api-keys',         icon: <FcKey size={17}/>,              module: 'MODULE_PLATFORM', feature: 'FEATURE_API_KEYS', superAdminOnly: true },
        { name: 'Integrations',    path: '/platform/integrations',     icon: <FcElectricalSensor size={17}/>, module: 'MODULE_PLATFORM', feature: 'FEATURE_INTEGRATIONS', superAdminOnly: true },
        { name: 'Webhooks',        path: '/platform/webhooks',         icon: <FcLink size={17}/>,             module: 'MODULE_PLATFORM', feature: 'FEATURE_WEBHOOKS', superAdminOnly: true },
      ]},
      { name: 'Compliance & Audit', items: [
        { name: 'Audit Log',       path: '/platform/audit',            icon: <FcInspection size={17}/>,       module: 'MODULE_COMPLIANCE', feature: 'FEATURE_AUDIT_LOG', superAdminOnly: true },
        { name: 'Error Log',       path: '/platform/errors',           icon: <FcHighPriority size={17}/>,     module: 'MODULE_COMPLIANCE', feature: 'FEATURE_ERROR_LOG', superAdminOnly: true },
      ]}
    ]
  }
];"""

pattern = r"const NAVIGATION:\s*NavGroup\[\]\s*=\s*\[(.*?)\];"
new_content = re.sub(pattern, new_navigation.replace('\\', '\\\\'), content, flags=re.DOTALL)

sidebar_path.write_text(new_content, encoding='utf-8')
print("Successfully updated Sidebar.tsx")
