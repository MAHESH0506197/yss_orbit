# Comprehensive Module Inventory

This is the fully updated inventory of all **47 modules** currently active in the YSS Orbit platform, mapping the frontend features to their respective backend boundaries.

### 🏢 Core Platform & Multi-Tenancy
| Module Name | Backend API | Frontend Feature | Description | Status |
|---|---|---|---|---|
| **Organization** | `organizations` | `organization` | Core tenant entity creation and setup. | ✅ Healthy |
| **Business Unit** | `business_units` | `businessUnit` | Branches/locations within an organization. | ✅ Healthy |
| **User BU Mapping** | `user_bu_mapping` | `userBusinessUnit` | Associates users with specific business units. | ✅ Healthy |
| **Tenant Domains** | `tenant_domains` | `tenantDomains` | System-wide domain types (merged from `domain` & `business_domain`). | ✅ Healthy |
| **Module Registry** | `modules` | `moduleRegistry` | Tracks available subscription modules system-wide. | ✅ Healthy |
| **Tenant Modules** | `tenant_modules` | `tenantModule` | Tracks which modules an organization is subscribed to. | ✅ Healthy |
| **Subscriptions** | `subscriptions` | `subscription` | Billing and SaaS subscription state. | ✅ Healthy |

### 🔐 Identity & Access Management (IAM)
| Module Name | Backend API | Frontend Feature | Description | Status |
|---|---|---|---|---|
| **Authentication** | `auth` | `authentication` | Login, password reset, and session management. | ✅ Healthy |
| **Users** | `users` | `users` | User profile creation, directory, and status. | ✅ Healthy |
| **Roles** | `roles` | `roles` | Custom and system-level roles definition. | ✅ Healthy |
| **RBAC / Permissions**| `permissions` | `rbac` | Granular capability checks and PermissionGates. | ✅ Healthy |

### 👥 HRMS (Human Resources)
| Module Name | Backend API | Frontend Feature | Description | Status |
|---|---|---|---|---|
| **HRMS Core** | `hrms` | `hrms` | Employee lifecycle, onboarding/offboarding, departments. | ✅ Healthy |
| **Attendance** | `attendance` | `attendance` | Time-tracking, check-in/out, and timesheets. | ✅ Healthy |
| **Leave** | `leave` | `leave` | Leave requests, accruals, and approvals. | ✅ Healthy |
| **Payroll** | `payroll` | `payroll` | Salary generation, payslips, and IT declarations. | ✅ Healthy |
| **Appraisal** | `appraisal` | `appraisal` | Performance reviews, goals, and 360 feedback. | ✅ Healthy |
| **Recruitment** | `recruitment` | `recruitment` | Job postings, pipelines, and interview scheduling. | ✅ Healthy |

### 📦 Inventory & Supply Chain
| Module Name | Backend API | Frontend Feature | Description | Status |
|---|---|---|---|---|
| **Inventory Core** | `inventory` | `inventory` | General stock counts and item master. | ✅ Healthy |
| **Batch Tracking** | `batch_tracking` | `batchTracking` | Lot/Batch specific quantity tracking. | ✅ Healthy |
| **Expiry Tracking** | `expiry_tracking`| `expiryTracking` | Per-batch expiration dates and alerts. | ✅ Healthy |
| **Stock Transfer** | `stock_transfer` | `stockTransfer` | Moving items between business units/locations. | ✅ Healthy |
| **Vendor Mgmt** | `vendors` | `vendorManagement`| Supplier profiles and purchasing data. | ✅ Healthy |

### 🛒 Sales, CRM & Point of Sale (POS)
| Module Name | Backend API | Frontend Feature | Description | Status |
|---|---|---|---|---|
| **POS Core** | `pos` | `pos` | Register interface for ringing up transactions. | ✅ Healthy |
| **Retail Billing** | `billing_retail` | `retailBilling` | Standard retail invoicing. | ✅ Healthy |
| **Pharmacy Billing**| `billing_pharmacy` | `pharmacyBilling`| Prescription-aware invoicing and tax handling. | ✅ Healthy |
| **General Billing** | `billing` | `billing` | Core invoicing and payment collection logic. | ✅ Healthy |
| **Customers** | `customers` | `customers` | Retail/Pharmacy end-consumer profiles. | ✅ Healthy |
| **CRM** | `crm` | `crm` | Sales pipelines, leads, and engagement. | ✅ Scaffolded |
| **Drug Register** | `drug_register` | `drugRegister` | Pharmaceutical master catalog handling. | ✅ Healthy |

### 📊 Observability & Reporting
| Module Name | Backend API | Frontend Feature | Description | Status |
|---|---|---|---|---|
| **Audit Trail** | `audit` | `audit` | Append-only system activity logging. | ✅ Healthy |
| **Error Log** | `error_log` | `errorLog` | Exception tracking and system faults. | ✅ Healthy |
| **Observability** | `telemetry` | `observability` | Metrics and traces (Datadog/Sentry). | ✅ Healthy |
| **Dashboard** | `analytics` | `dashboard` | Visual BI charts and widgets. | ✅ Healthy |
| **Reporting** | `reports` | `reporting` | CSV/PDF exports and tabular data reports. | ✅ Healthy |

### ⚙️ Settings, Operations & Support
| Module Name | Backend API | Frontend Feature | Description | Status |
|---|---|---|---|---|
| **Notifications** | `notifications` | `notifications` | In-app alerts, emails, and SMS queue (Consolidated from `notification`). | ✅ Healthy |
| **File Storage** | `storage` | `fileStorage` | AWS S3 / blob storage abstractions. | ✅ Healthy |
| **Integrations** | `integrations` | `integration` | 3rd-party webhooks and API Keys. | ✅ Healthy |
| **Feature Flags** | `feature_flags` | `featureFlags` | Toggle logic (LaunchDarkly/PostHog). | ✅ Healthy |
| **Branding** | `branding` | `branding` | White-label UI, logos, and custom colors. | ✅ Healthy |
| **Tenant Settings** | `settings` | `tenantSettings` | Organization-level configuration overrides. | ✅ Healthy |
| **Platform Health** | `health` | `health` | Status indicators and uptime ping. | ✅ Healthy |
| **Support** | `support_tickets`| `support` | Internal ticketing and tenant diagnostics. | ✅ Healthy |
| **Admin** | `admin` | `admin` | Internal overrides and break-glass capabilities. | ✅ Healthy |
| **Platform Admin** | `platform` | `platformAdmin` | Super admin portal dashboard routing. | ✅ Healthy |
