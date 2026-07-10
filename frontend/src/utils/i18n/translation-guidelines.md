# YSS Orbit Translation Guidelines

To maintain an enterprise-grade, consistent multilingual experience across the platform, all developers must strictly adhere to these translation guidelines.

## 1. Do NOT Translate System Identifiers & Master Data
The following entities are considered technical identifiers or source-of-truth master data and must **never** be translated:
- **Business Domain Names**: e.g., "Retail", "Pharmacy", "Hospital"
- **Role Names**: e.g., "HRMS_ADMIN", "Super Admin" (if derived from DB)
- **Permission Codes**: e.g., "platform.users.create"
- **Module Codes**: e.g., "hrms", "payroll"
- **Technical Logs**: Server logs, error stacks, audit event codes

## 2. Standardize Business Terminology
Translate the following core concepts consistently across all modules:
- **Business Unit**: వ్యాపార విభాగం
- **Organization**: సంస్థ
- **User**: వాడుకరి
- **Role**: పాత్ర (When referring to UI labels)
- **Permission**: అనుమతి

## 3. Component-Level Translation Rules
- **Buttons**: Must be translated (e.g., Save → సేవ్ చేయండి)
- **Status Text**: Must be translated (e.g., Active → చురుకుగా ఉంది)
- **Navigation/Menus**: Must be translated
- **Table Headers**: Must be translated

## 4. Translation JSON Taxonomy
Do not use flat translation keys. All new strings must be added to the appropriate category in the JSON files:
- `navigation`: Sidebar, Header, Breadcrumbs
- `pages`: Page titles, specific page headers
- `forms`: Field labels, placeholders
- `validation`: Frontend form validation errors
- `tables`: Headers, empty states
- `buttons`: Action triggers
- `status`: Lifecycle statuses
- `roles`: Static role labels (if any)
- `modules`: UI module names
- `messages`: Toasts, success/error notifications

## 5. Audit Requirement
Before completing any translation phase, the `npm run i18n:audit` command MUST be executed. Code should only be merged when the module reports **100% Coverage**.
