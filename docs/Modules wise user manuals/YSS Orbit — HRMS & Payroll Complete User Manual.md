# YSS Orbit — HRMS & Payroll Complete User Manual

> **Version:** 4.0 | **Date:** June 2026
> **Audience:** HR Managers · Finance Admins · Department Managers · Employees
> **System:** YSS Orbit — Enterprise HRMS & Payroll Platform

---

## Table of Contents

1. [System Overview & Roles](#1-system-overview--roles)
2. [Module 1 — Initial System Setup](#2-module-1--initial-system-setup)
3. [Module 2 — Employee Master Management](#3-module-2--employee-master-management)
4. [Module 3 — Onboarding Workflow](#4-module-3--onboarding-workflow)
5. [Module 4 — Attendance Management](#5-module-4--attendance-management)
6. [Module 5 — Leave Management](#6-module-5--leave-management)
7. [Module 6 — Payroll Processing](#7-module-6--payroll-processing)
8. [Module 7 — Employee Self-Service (ESS)](#8-module-7--employee-self-service-ess)
9. [Module 8 — Manager Self-Service (MSS)](#9-module-8--manager-self-service-mss)
10. [Module 9 — Analytics & Reports](#10-module-9--analytics--reports)
11. [Module 10 — Exit & Offboarding](#11-module-10--exit--offboarding)
12. [Module 11 — Statutory Compliance Reports](#12-module-11--statutory-compliance-reports)
13. [End-to-End Monthly Payroll Cycle (Summary)](#13-end-to-end-monthly-payroll-cycle-summary)
14. [Notification Reference](#14-notification-reference)
15. [Role × Permission Matrix](#15-role--permission-matrix)

---

## 1. System Overview & Roles

### 1.1 What is YSS Orbit?

YSS Orbit is a multi-tenant Enterprise HRMS and Payroll platform covering the complete employee lifecycle — from hire to retirement — including:

- **Employee Master** (core records, documents, org structure)
- **Onboarding & Offboarding** (task-based workflows)
- **Attendance** (punch-in/out, shifts, corrections, locking)
- **Leave** (application, approval, balance tracking, LOP)
- **Payroll** (computation, approval, payslips, statutory compliance)
- **ESS/MSS** (employee and manager self-service portals)
- **Analytics** (HR, Payroll, Attendance, Leave dashboards)
- **Compliance** (Form 16, PF ECR, ESI Return, PT Return)

### 1.2 User Roles

| Role | Who | Key Permissions |
|------|-----|----------------|
| **Platform Admin** | YSS Orbit system admin | Manage tenants, all permissions |
| **HR Admin** | Head of HR | All HRMS operations, payroll approval |
| **HR Manager** | HR team member | Employee CRUD, leave approval, attendance |
| **Finance Admin** | Finance head | Payroll lock/unlock, compliance reports |
| **Department Manager** | Team leads | MSS — team leave approval, team attendance |
| **Employee** | All staff | ESS — punch, apply leave, view payslip |

### 1.3 Application Flow Overview

```
System Setup → Employee Created → Onboarding →
Daily: Punch In/Out → Leave (if needed) →
Month End: Attendance Lock → Payroll Run → Approval → Payslips →
Exit: Offboarding → Final Settlement
```

---

## 2. Module 1 — Initial System Setup

> **Done by:** HR Admin / Platform Admin
> **When:** Before any employees are added — one-time setup per Business Unit

### Step 1.1 — Create Departments

**Path:** HR Admin → Organisation → Departments → + Add Department

| Field | Required | Description |
|-------|----------|-------------|
| Department Name | ✅ | e.g., "Engineering", "Finance" |
| Department Code | ✅ | Short code, e.g., "ENG", "FIN" |
| Parent Department | ❌ | For hierarchical org chart |
| Head of Department | ❌ | Assign after employee is created |

**Result:** Department appears in employee forms and org chart.

---

### Step 1.2 — Create Designations

**Path:** HR Admin → Organisation → Designations → + Add Designation

| Field | Required | Description |
|-------|----------|-------------|
| Designation Name | ✅ | e.g., "Senior Engineer", "Team Lead" |
| Designation Code | ✅ | Short code |
| Department | ✅ | Which department this designation belongs to |
| Grade/Band | ❌ | Pay grade (e.g., L4, L5) |

---

### Step 1.3 — Create Shifts

**Path:** HR Admin → Attendance → Shifts → + Add Shift

| Field | Required | Description |
|-------|----------|-------------|
| Shift Name | ✅ | e.g., "Morning 9–6", "Night Shift" |
| Start Time | ✅ | e.g., 09:00 |
| End Time | ✅ | e.g., 18:00 |
| Grace Time (minutes) | ✅ | Late tolerance, e.g., 15 |
| Work Days | ✅ | Select Mon–Fri, Mon–Sat, etc. |
| Weekly Off | ✅ | e.g., Saturday, Sunday |

**Business Rule:** If actual punch-in is after Start Time + Grace Time, attendance status = LATE.

---

### Step 1.4 — Set Up Holiday Calendar

**Path:** HR Admin → Attendance → Holiday Calendar → + Add Calendar → + Add Holidays

| Field | Description |
|-------|-------------|
| Calendar Name | e.g., "Karnataka 2026" |
| Is Default | ✅ Check for the primary calendar |
| Holiday Date | Date of the holiday |
| Holiday Name | e.g., "Diwali", "Independence Day" |
| Holiday Type | National / Regional / Optional |

**Business Rule:** Leave calculations and attendance auto-status respect the default holiday calendar.

---

### Step 1.5 — Set Up Leave Types

**Path:** HR Admin → Leave → Leave Types → + Add Leave Type

| Field | Required | Description |
|-------|----------|-------------|
| Leave Type Name | ✅ | e.g., "Casual Leave", "Earned Leave", "LOP" |
| Leave Code | ✅ | CL, EL, LOP, SL, ML, PL |
| Total Days Per Year | ✅ | Annual entitlement |
| Is LOP | ❌ | Check for Loss of Pay leave type |
| Requires Approval | ✅ | Toggle (LOP usually auto-approved) |
| Requires HR Approval | ❌ | Two-step approval if checked |
| Allow Negative Balance | ❌ | Allow overshoot of balance |
| Exclude Weekends | ✅ | Don't count Sat/Sun in leave days |
| Exclude Holidays | ✅ | Don't count public holidays |
| Requires Attachment | ❌ | e.g., medical certificate for sick leave |
| Attachment After Days | ❌ | e.g., require doc if sick leave > 2 days |

---

### Step 1.6 — Set Up Salary Components

**Path:** HR Admin → Payroll → Salary Components → + Add Component

| Field | Required | Description |
|-------|----------|-------------|
| Component Name | ✅ | e.g., "Basic Salary", "HRA", "Transport Allowance" |
| Component Code | ✅ | BASIC, HRA, TA, PF, ESI, PT |
| Type | ✅ | EARNING / DEDUCTION |
| Calculation Type | ✅ | FIXED, PERCENTAGE_OF_BASIC, PERCENTAGE_OF_GROSS |
| Percentage Value | ❌ | e.g., 40 (for HRA = 40% of Basic) |
| Is Statutory | ❌ | PF, ESI, PT, LWF — handled by engine |
| Is Active | ✅ | Toggle on/off |

**Pre-configured statutory components (auto-computed):**
- PF Employee: 12% of Basic (max ₹1,800/month)
- PF Employer: 12% of Basic
- ESI Employee: 0.75% of Gross (if Gross ≤ ₹21,000)
- ESI Employer: 3.25% of Gross
- Professional Tax: State-wise slab (set `state_code` on employee)
- TDS: Computed from annualised CTC vs tax declaration

---

### Step 1.7 — Create Salary Structures

**Path:** HR Admin → Payroll → Salary Structures → + Create Structure

| Field | Required | Description |
|-------|----------|-------------|
| Structure Name | ✅ | e.g., "Standard Full-Time", "Contractor Structure" |
| Description | ❌ | Free text |
| Components | ✅ | Drag-and-drop components from library into structure |

**Steps to build a structure:**
1. Click **+ Create Structure**
2. Enter structure name
3. From the **Component Library** (left panel), drag components into the structure
4. Set percentage or fixed values for each component
5. Preview the **Live CTC Breakdown** (right panel shows sample payslip)
6. Click **Save Structure**

**Business Rule:** Each employee's `salary_structure` is linked from their profile. Payroll engine reads the structure to compute gross and deductions.

---

### Step 1.8 — Set Up Professional Tax Slabs

**Path:** HR Admin → Payroll → Professional Tax → + Add PT Slab

| Field | Required | Description |
|-------|----------|-------------|
| State Code | ✅ | KA, MH, AP, TN, WB, TS, GJ, etc. |
| Min Salary | ✅ | Lower bound of slab |
| Max Salary | ✅ | Upper bound (use 99999999 for no upper limit) |
| Monthly Amount | ✅ | PT to deduct per month |

**Important:** Add slabs for every state where you have employees. If a slab is missing for an employee's state, PT defaults to ₹0.

---

## 3. Module 2 — Employee Master Management

> **Done by:** HR Admin / HR Manager
> **When:** When hiring a new employee (before their start date)

### Step 2.1 — Create a New Employee

**Path:** HR → Employees → + Add Employee

**Tab 1: Personal Information**

| Field | Required | Notes |
|-------|----------|-------|
| First Name | ✅ | |
| Last Name | ✅ | |
| Date of Birth | ✅ | |
| Gender | ✅ | Male / Female / Other |
| Marital Status | ❌ | |
| Personal Email | ✅ | Used for initial login |
| Personal Phone | ✅ | |
| Permanent Address | ✅ | |
| Current Address | ❌ | |
| Emergency Contact Name | ❌ | |
| Emergency Contact Phone | ❌ | |

**Tab 2: Employment Details**

| Field | Required | Notes |
|-------|----------|-------|
| Employee Code | ✅ | Auto-generated or manual (must be unique) |
| Date of Joining | ✅ | |
| Department | ✅ | From setup (Step 1.1) |
| Designation | ✅ | From setup (Step 1.2) |
| Reporting Manager | ❌ | Soft FK — UUID of manager employee |
| Employment Type | ✅ | FULL_TIME / PART_TIME / CONTRACT / INTERN |
| Worker Type | ✅ | EMPLOYEE / CONTRACTOR — **critical for PF/ESI exclusion** |
| Employment Status | ✅ | ACTIVE (set on creation) |
| Shift | ✅ | From setup (Step 1.3) |
| Location / Branch | ❌ | |
| Cost Center | ❌ | |

**Tab 3: Compensation**

| Field | Required | Notes |
|-------|----------|-------|
| Basic Salary (monthly) | ✅ | Used for PF, PT slab |
| CTC (annual) | ✅ | Full Cost to Company |
| Salary Structure | ✅ | Link to structure created in Step 1.7 |
| State Code | ✅ | **Critical for PT** — KA, MH, AP, etc. |
| Payment Mode | ✅ | BANK_TRANSFER / CHEQUE / CASH |
| Bank Name | ❌ | |
| Account Number | ❌ | Stored encrypted |
| IFSC Code | ❌ | |

**Tab 4: Statutory**

| Field | Required | Notes |
|-------|----------|-------|
| PAN Number | ✅ | For TDS computation |
| Aadhaar Number | ❌ | Stored encrypted |
| UAN (PF Universal Account) | ❌ | |
| ESI Number | ❌ | |

Click **Save Employee** — system creates the employee record with `ACTIVE` status and publishes a `HIRED` EmployeeEvent to the 360 Timeline.

---

### Step 2.2 — Upload Employee Photo

**Path:** Employees → Open Employee → Profile Photo → Upload

- Formats: JPG, PNG
- Max size: 2MB
- System resizes and stores securely in S3

---

### Step 2.3 — Upload Employee Documents

**Path:** Employees → Open Employee → Documents Tab → + Upload Document

| Field | Required |
|-------|----------|
| Document Type | ✅ (Offer Letter, PAN Card, Aadhaar, Degree, etc.) |
| Document File | ✅ (PDF, JPG, PNG — max 10MB) |
| Expiry Date | ❌ (for time-limited documents like driving licence) |
| Description | ❌ |

**Business Rule:** Celery Beat job (`notify_document_expiry_task`) runs weekly and sends email/in-app alerts 30 days before document expiry.

---

### Step 2.4 — Bulk Employee Import (CSV)

**Path:** HR → Employees → Import → Download Template → Fill → Upload

**Step-by-step:**

1. **Download Template** — `GET /api/v1/hrms/employees/import/template/`
   - Downloads a pre-formatted CSV with all required columns
2. **Fill the CSV** — Complete all required columns for each employee
3. **Upload CSV** — `POST /api/v1/hrms/employees/import/upload/`
   - Returns `session_id`
4. **Validate** — `POST /api/v1/hrms/employees/import/validate/{session_id}/`
   - Returns validation errors per row (duplicate codes, invalid status, etc.)
5. **Fix Errors** — `GET /api/v1/hrms/employees/import/errors/{session_id}/`
   - Download error report, fix CSV, re-upload
6. **Execute** — `POST /api/v1/hrms/employees/import/execute/{session_id}/`
   - Creates all validated employees atomically
7. **History** — `GET /api/v1/hrms/employees/import/history/`
   - View all past import sessions with status and counts

---

### Step 2.5 — Edit Employee Record

**Path:** Employees → Search Employee → Open → Edit

- All tabs are editable
- Each save creates an audit log entry (`updated_by`, `updated_at`)
- **Salary changes** publish `SALARY_REVISED` to the Employee 360 Timeline

---

### Step 2.6 — Soft Delete / Deactivate Employee

- Employees are **never hard deleted**
- To deactivate: set `Employment Status` → `TERMINATED` or `RESIGNED`
- Soft-deleted records remain fully auditable but do not appear in active employee lists

---

## 4. Module 3 — Onboarding Workflow

> **Done by:** HR Admin initiates → Employee completes tasks → HR marks done
> **When:** After employee record is created, before/on joining date

### Step 3.1 — Initiate Onboarding

**Path:** HR → Employees → Open Employee → Onboarding Tab → Initiate Onboarding

- **API:** `POST /api/v1/hrms/employees/{emp_id}/onboarding/init/`
- System creates an `OnboardingChecklist` with a standard set of tasks
- Publishes `ONBOARDING_STARTED` to Employee 360 Timeline

**Default onboarding tasks generated:**
1. Account credentials issued
2. IT equipment assigned
3. ID card created
4. Induction training scheduled
5. PF/ESI/UAN registration
6. Bank account details collected
7. Document verification complete
8. Reporting manager introduction

---

### Step 3.2 — Track Onboarding Progress

**Path:** HR → Employees → Open Employee → Onboarding Tab

- **API:** `GET /api/v1/hrms/employees/{emp_id}/onboarding/progress/`
- Shows completion percentage and task status for each checklist item

---

### Step 3.3 — Complete Onboarding Tasks

**Done by:** HR or the assigned task owner

- **API:** `POST /api/v1/hrms/onboarding/{onboarding_id}/tasks/{task_id}/complete/`
- Marks the specific task as `COMPLETED`
- When all tasks done → system auto-sets employee status to `CONFIRMED` and publishes `ONBOARDING_DONE` event

---

### Step 3.4 — Probation Confirmation

**Path:** HR → Employees → Open Employee → Employment Tab → Set Status = CONFIRMED

- Publishes `CONFIRMED` event to Employee 360 Timeline
- Typically done after the probation period (3–6 months from joining)

---

## 5. Module 4 — Attendance Management

> **Actors:** Employee (punch), HR Manager (corrections, reports), System (auto-lock)
> **Flow:** Daily Punch → Auto-compute → Correction (if needed) → Month-end Lock

### Step 4.1 — Employee Punch In / Punch Out

**Path (ESS):** My Attendance → Punch In button

- **API:** `POST /api/v1/hrms/attendance/{record_id}/punch/`
- System alternates: first punch = PUNCH_IN, next = PUNCH_OUT, and so on
- Punch is timestamped with server time (not browser time)
- Punch sources: WEB, MOBILE, BIOMETRIC

**What happens automatically:**
- System creates/finds `AttendanceRecord` for today
- First IN punch → `actual_in` set
- Last OUT punch → `actual_out` set
- Work hours computed (sum of all IN→OUT intervals)
- Late minutes computed if `actual_in > shift.start_time + grace_time`
- Status auto-set: PRESENT / LATE / HALF_DAY / MISSED_PUNCH / ABSENT

**Attendance Status Logic:**

| Condition | Status |
|-----------|--------|
| Has IN + OUT, work hours ≥ 4h | PRESENT |
| Has IN + OUT, work hours ≥ 4h, late > 0 | LATE |
| Has IN + OUT, work hours < 4h | HALF_DAY |
| Has IN, no OUT | MISSED_PUNCH |
| No punch, approved leave exists | PAID_LEAVE / UNPAID_LEAVE |
| No punch, holiday calendar | HOLIDAY |
| No punch, weekend per shift | WEEK_OFF |
| No punch, no leave, no holiday | ABSENT |

---

### Step 4.2 — Generate Missing Attendance Records

**Path:** HR → Attendance → Generate Daily Records

- Run by Celery Beat job automatically at end of each business day
- Can be triggered manually via admin for a specific date
- For employees with no punch: creates records with status ABSENT/HOLIDAY/WEEK_OFF/ON_LEAVE based on context

---

### Step 4.3 — View Attendance Records

**Path (HR):** Attendance → Attendance Dashboard → Filter by Date/Employee/Department

**API:** `GET /api/v1/hrms/attendance/`

Filters available:
- `employee_id` — specific employee
- `start_date` / `end_date` — date range
- `status` — PRESENT, ABSENT, LATE, etc.
- `department_id` — all employees in a department

---

### Step 4.4 — Request Attendance Correction

**Path (Employee):** ESS → My Attendance → + Request Correction

| Field | Required | Description |
|-------|----------|-------------|
| Attendance Date | ✅ | Which day to correct |
| Reason | ✅ | Why the correction is needed |
| Requested Status | ✅ | What the status should be |
| Requested Punch Times | ❌ | Corrected IN/OUT times |

- **API:** `POST /api/v1/hrms/attendance-correction/`
- Correction request goes to HR/Manager for approval

---

### Step 4.5 — Approve Attendance Correction

**Path (Manager/HR):** MSS → Team Attendance → Corrections Tab → Approve / Reject

- **API:** `PATCH /api/v1/hrms/attendance-correction/{id}/`
- On approval: `AttendanceRecord` status/times are updated
- On rejection: Request marked REJECTED with comment

> [!IMPORTANT]
> **Locked Attendance Cannot Be Corrected.** Once attendance is locked for payroll (Step 6.3), corrections are blocked. Raise to HR/Finance to unlock if needed.

---

### Step 4.6 — Attendance Lock (Month-End)

**Done by:** System automatically after payroll generation (Step 6.4), OR manually by HR Admin

- Locks all `AttendanceRecord` rows for the payroll month
- `is_locked = True`, `locked_at = timestamp`, `locked_by_user_id = run_by_id`
- Once locked: no punch modifications, no correction approvals possible

**Verify locked records:**
```
HR → Attendance → Filter Month → Check "Locked" badge on records
```

---

## 6. Module 5 — Leave Management

> **Flow:** Employee applies → Manager approves → HR approves (if required) → Attendance updated → Balance deducted

### Step 5.1 — Check Leave Balances

**Path (ESS):** My Leave → Balance Cards

**API:** `GET /api/v1/hrms/leave/balances/?employee_id={id}`

Shows per leave type:
- Opening Balance
- Consumed Days (approved leaves)
- Closing Balance (available)
- Year

---

### Step 5.2 — Apply for Leave

**Path (ESS):** My Leave → + Apply Leave

| Field | Required | Notes |
|-------|----------|-------|
| Leave Type | ✅ | From available types (Step 1.5) |
| From Date | ✅ | |
| To Date | ✅ | |
| Session | ✅ | FULL_DAY / FIRST_HALF / SECOND_HALF |
| Reason | ✅ | |
| Attachment | ❌/✅ | Required if leave type mandates it |

**API:** `POST /api/v1/hrms/leave/requests/`

**System validates:**
1. Date range valid (end ≥ start)
2. No overlap with existing approved/pending leave
3. No blackout/restriction window for the BU in that period
4. Sufficient balance (unless `allow_negative_balance = True` or `is_lop = True`)
5. Attachment present if required

**Leave days calculated:**
- Weekends excluded if `exclude_weekends = True`
- Holidays excluded if `exclude_holidays = True`
- Half-day = 0.5 days

**Status after creation:**
- If leave type `requires_approval = False` → immediately **APPROVED**
- If `requires_approval = True` → **SUBMITTED** (awaiting manager)

---

### Step 5.3 — Manager Approves Leave

**Path (MSS):** Team Leave → Pending Tab → Approve / Reject

**API:** `POST /api/v1/hrms/leave/requests/{id}/approve/`

Request body:
```json
{
  "action": "APPROVE",
  "comments": "Approved. Enjoy your break."
}
```

**If leave type requires HR approval:**
- Status moves to `MANAGER_APPROVED` (not yet active)
- Leave request goes to HR's queue

**If no HR approval needed:**
- Status = `APPROVED` immediately
- `_post_approval_actions` fires:
  1. Leave balance deducted
  2. `AttendanceRecord` created/updated with `PAID_LEAVE` or `UNPAID_LEAVE` for each leave day
  3. `LEAVE_APPROVED` EmployeeEvent published to Employee 360 Timeline
  4. Email + in-app notification sent to employee

---

### Step 5.4 — HR Approves Leave (Second Step, if Required)

**Path (HR):** Leave Management → Manager Approved Tab → Approve / Reject

**API:** `POST /api/v1/hrms/leave/requests/{id}/approve/` with HR role

- Same endpoint — role determines which approval step executes
- On HR approval: same `_post_approval_actions` fires (balance deduction + attendance update + notifications)

---

### Step 5.5 — Cancel Leave

**Path (ESS):** My Leave → History → Cancel (if still SUBMITTED / MANAGER_APPROVED)

- Cancellation restores the deducted balance
- Attendance records updated back to ABSENT/PRESENT

---

### Step 5.6 — Leave Restriction Windows (Blackout Dates)

**Path:** HR Admin → Leave → Restriction Windows → + Add Window

| Field | Description |
|-------|-------------|
| Window Name | e.g., "Year-end Audit Freeze" |
| From Date | Blackout start |
| To Date | Blackout end |
| Is Active | Toggle |

During a blackout window: any leave application for those dates is **auto-rejected** with the reason.

---

### Step 5.7 — Leave Allocation (Annual)

**Path:** HR Admin → Leave → Allocations → Bulk Allocate

- Sets the `opening_balance` for each employee × leave type × year
- Can be done individually or bulk via CSV
- System auto-creates `LeaveBalance` records

---

## 7. Module 6 — Payroll Processing

> **Flow (Monthly):** Tax Declarations → Pre-checks → Generate → HR Approve → Finance Lock → Payslips → Archive

> [!IMPORTANT]
> Payroll operates on a **two-step approval**: HR Manager approves, then Finance Admin locks. A locked payroll run is **immutable** — it cannot be re-generated.

---

### Step 6.1 — Employee Tax Declaration (ESS, Annual)

**Path (ESS):** My Payroll → Tax Declaration → + New Declaration

**API:** `POST /api/v1/payroll/tax-declarations/`

| Field | Description |
|-------|-------------|
| Financial Year | e.g., 2026–27 |
| Tax Regime | OLD / NEW (default = NEW from FY24-25) |
| 80C Investments | ELSS, PPF, LIC (max ₹1.5L, only in old regime) |
| 80D Health Insurance | Premium paid |
| HRA Claimed | House Rent Allowance exemption |
| Other Deductions | 80E, 80G, etc. |

**Status flow:**
1. `DRAFT` — employee filling
2. `POST /tax-declarations/{id}/submit/` → `SUBMITTED`
3. HR reviews → `POST /tax-declarations/{id}/verify/` → `VERIFIED`
4. Finance locks → `POST /tax-declarations/{id}/lock/` → `LOCKED`

**Business Rule:** TDS deducted each month = Annual estimated tax ÷ 12. If declaration changes mid-year, TDS is re-spread over remaining months.

---

### Step 6.2 — Variable Pay (Bonus, Incentive)

**Path:** HR Admin → Payroll → Variable Pay → + Add Variable Pay

**API:** `POST /api/v1/payroll/variable-pay/`

| Field | Description |
|-------|-------------|
| Employee | Target employee |
| Pay Component | BONUS, PERFORMANCE_INCENTIVE, etc. |
| Amount | ₹ amount |
| Month / Year | Which payroll run it applies to |
| Remarks | Justification |

**Approval:** `POST /api/v1/payroll/variable-pay/{id}/approve/`

Variable pay is injected into gross salary for the specified month's payroll run.

---

### Step 6.3 — Pre-Payroll Checks (T-2 Days)

Before generating payroll, HR Admin must verify:

1. **All attendance locked** for the month (Step 4.6)
   - Check: HR → Attendance → Any UNLOCKED records for the month?
2. **No pending corrections > 48 hours old**
   - Check: HR → Attendance → Corrections → Pending tab
3. **IT declarations submitted by employees** (for accurate TDS)
   - Check: HR → Payroll → Tax Declarations → Missing for which employees?
4. **PT slabs configured** for all employee states
   - Check: HR Admin → Payroll → PT Slabs → Are all state codes covered?
5. **Salary structures assigned** to all active employees
   - Check: HR → Employees → Filter `salary_structure = NULL`

---

### Step 6.4 — Generate Payroll Run

**Path:** HR Admin / Finance → Payroll → Payroll Runs → + Generate Run

**API:** `POST /api/v1/payroll/runs/generate/`

Request body:
```json
{
  "month": 6,
  "year": 2026
}
```

**What the engine computes for each employee:**

| Computation | Logic |
|-------------|-------|
| Working Days | Calendar days in month |
| LOP Days | Count of UNPAID_LEAVE attendance records |
| Gross Salary | Salary structure components applied |
| LOP Deduction | (Basic ÷ Working Days) × LOP Days |
| Basic Salary | Per salary structure |
| HRA | % of Basic per structure |
| Other Allowances | Per structure |
| PF Employee | 12% of Basic (capped at ₹1,800) |
| PF Employer | 12% of Basic (employer share) |
| ESI Employee | 0.75% of Gross if Gross ≤ ₹21,000 |
| ESI Employer | 3.25% of Gross if Gross ≤ ₹21,000 |
| Professional Tax | State-wise slab on net |
| TDS | Annualised salary × slab rate ÷ 12 |
| LWF | State-wise (Karnataka: ₹20 in June/Dec) |
| Variable Pay | Approved bonus injected into gross |
| Net Salary | Gross − All Deductions |

**Contractors (`worker_type = CONTRACTOR`):** PF, ESI, PT, LWF all set to ₹0 automatically.

**Run status after generation:** `PROCESSED`

After generation, the system automatically:
- Locks attendance for the month
- Publishes `PAYROLL_PROCESSED` EmployeeEvent to each employee's 360 Timeline

---

### Step 6.5 — Review Payroll Run

**Path:** HR Admin → Payroll → Payroll Runs → Open Run

Review:
- Total employees processed
- Total Gross, Total Deductions, Total Net
- Drill down: click any employee to see their payslip breakdown
- Check for zero/negative net pay (flag anomaly)
- Check for unusually high/low values

**Payroll run can be re-generated** (only while status = `DRAFT` or `PROCESSED`):
- Re-generation deletes all existing payslips and recomputes from scratch
- Not allowed if status = `APPROVED`, `LOCKED`, or `FAILED`

---

### Step 6.6 — HR Approval

**Path:** HR Admin → Payroll → Payroll Runs → Open Run → Approve

**API:** `POST /api/v1/payroll/approval/{run_id}/approve/`

- Requires role: `hr_manager` or `hr_admin`
- Run status: `PROCESSED` → `APPROVED`
- Once approved: run can no longer be re-generated (must rollback to PROCESSED first)

---

### Step 6.7 — Finance Lock (Final)

**Path:** Finance Admin → Payroll → Payroll Runs → Open Run → Lock

**API:** `POST /api/v1/payroll/approval/{run_id}/lock/`

- Requires role: `finance_admin`
- Run status: `APPROVED` → `LOCKED`
- **LOCKED is immutable** — payslips are now final and cannot be changed
- Triggers: Celery task sends payslip notification to all employees

---

### Step 6.8 — Employee Views Payslip (After Lock)

**Path (ESS):** My Payslips → Select Month → Expand → Download PDF

**API:** `GET /api/v1/payroll/payslips/?my_payslips=true`

Payslip shows:
- Earnings breakdown (Basic, HRA, TA, Variable Pay)
- Deductions breakdown (PF, ESI, PT, TDS, LWF, LOP)
- Gross salary
- Total deductions
- **Net salary (take-home)**
- YTD (Year-to-Date) cumulative

---

### Step 6.9 — Archive Old Payroll Runs

**Path:** HR Admin → Payroll → Archive (or automatic via Celery Beat)

**Management command:** `python manage.py archive_old_payroll_runs`

- Archives LOCKED runs older than 7 years (statutory retention requirement)
- Run automatically by Celery Beat on the 1st of every month

---

## 8. Module 7 — Employee Self-Service (ESS)

> **Path:** App → My Dashboard → (Attendance / Leave / Payslips)
> **Accessed by:** All employees (no special role needed)

### ESS 7.1 — My Attendance Page

**Path:** My Attendance

**Features:**
| Feature | Description |
|---------|-------------|
| Live Clock | Real-time clock showing current time |
| Punch In/Out Widget | Big button — IN if not punched, OUT if currently in |
| Today's Status Card | Shows current status, actual IN/OUT, work hours so far |
| Monthly Calendar | Heat-map of month — green=present, red=absent, yellow=late |
| Request Correction | Form to raise a correction request for any past day |
| Correction History | Status of all submitted correction requests |

---

### ESS 7.2 — My Leave Page

**Path:** My Leave

**Features:**
| Feature | Description |
|---------|-------------|
| Balance Cards | One card per leave type with progress bar showing remaining days |
| Apply Leave | Button opens modal: leave type, date range, session, reason, attachment |
| Leave History Table | All past requests with status badge (Pending/Approved/Rejected/Cancelled) |
| Cancel Leave | Cancel SUBMITTED or MANAGER_APPROVED requests |

---

### ESS 7.3 — My Payslips Page

**Path:** My Payslips

**Features:**
| Feature | Description |
|---------|-------------|
| YTD Summary Cards | Year-to-date Gross, Deductions, Net, TDS paid |
| Payslip List | One row per month, expandable |
| Expanded View | Full earnings + deductions breakdown for that month |
| Download PDF | Downloads payslip as PDF |

---

### ESS 7.4 — Tax Declaration (ESS)

**Path:** My Payslips → Tax Declaration

See Step 6.1 above — employee fills in investments/deductions, submits for HR verification.

---

## 9. Module 8 — Manager Self-Service (MSS)

> **Path:** App → My Team → (Leave / Attendance)
> **Accessed by:** Employees with Department Manager role

### MSS 8.1 — Team Leave Approval

**Path:** My Team → Team Leave

**Tabs:**
- **Pending** — All SUBMITTED leave requests from direct reports (alert badge shows count)
- **Approved** — History of approved leaves
- **All** — Full team leave history with filters

**Approve action:**
1. Click on a leave request
2. Review: employee name, leave type, dates, days, reason
3. Enter comments (mandatory for rejection)
4. Click **Approve** or **Reject**
5. System updates status, fires notifications

**Filter options:** Date range, Employee name, Leave type, Status

---

### MSS 8.2 — Team Attendance Oversight

**Path:** My Team → Team Attendance

**Features:**
| Feature | Description |
|---------|-------------|
| Team Stats Cards | Today's: Present, Absent, Late, On Leave counts |
| Date Filter | View any date's team attendance |
| Status Filter | Filter by PRESENT, ABSENT, LATE, etc. |
| Team Table | All direct reports × status for selected date |
| Correction Approvals | Inline approve/reject correction requests from team members |

**Correction approval:**
1. Go to Corrections tab
2. See pending correction requests from your team
3. Review: date, reason, requested status
4. Click **Approve** or **Reject** with comment

---

## 10. Module 9 — Analytics & Reports

> **Done by:** HR Admin / Finance Admin / Department Manager
> **Path:** App → Analytics → (HR / Payroll / Attendance / Leave)

### Analytics 9.1 — HR Analytics Dashboard

**Path:** Analytics → HR Analytics

**Panels:**
| Panel | Metrics |
|-------|---------|
| KPI Row | Total Headcount, New Hires (YTD), Exits (YTD), Attrition Rate |
| Headcount Trend | Area chart — monthly headcount with new hires and exits |
| Department Breakdown | Donut chart + bar list — headcount by department |
| Attrition vs Industry | Dual bar chart comparing our rate vs industry average per dept |
| Gender Distribution | Donut chart — Male/Female/Other split |
| Employment Type | Full-time/Contract/Intern breakdown |
| Tenure Bands | Bar chart — < 1yr, 1–3yr, 3–5yr, 5–8yr, 8+ yr |
| Recent Exits | Table — name, department, exit reason, date, type |

**Period filter:** Q1, Q2, Q3, Q4, YTD

---

### Analytics 9.2 — Payroll Analytics Dashboard

**Path:** Analytics → Payroll Analytics

**Panels:**
| Panel | Metrics |
|-------|---------|
| KPI Row | Total Payroll Cost, Avg Net Salary, Total TDS, Total PF |
| Monthly Payroll Trend | Line chart — gross/net/deductions per month |
| Cost by Department | Bar chart — payroll cost breakdown by dept |
| Statutory Deductions | PF + ESI + PT + LWF split donut |
| Top Earners | Table — top 10 by net salary |
| LOP Impact | Chart — LOP days vs LOP deduction amount per month |

---

### Analytics 9.3 — Attendance Analytics Dashboard

**Path:** Analytics → Attendance Analytics

**Panels:**
| Panel | Metrics |
|-------|---------|
| KPI Row | Avg Attendance %, Avg Late %, Missed Punches, AWOP Days |
| Daily Trend | Line chart — present/absent/late per day |
| Department Attendance | Heatmap or bar chart by department |
| Late Arrivals Trend | Top departments/employees with late pattern |
| Shift Compliance | % of employees following their shift schedule |

---

### Analytics 9.4 — Leave Analytics Dashboard

**Path:** Analytics → Leave Analytics

**Panels:**
| Panel | Metrics |
|-------|---------|
| KPI Row | Total Leave Days (YTD), LOP Days, Avg Leaves per Employee |
| Leave Type Split | Donut — CL vs EL vs SL vs LOP |
| Monthly Leave Trend | Bar chart per month |
| Department Leave Rate | Which depts take most leave |
| Pending Approvals | Count of unapproved leave requests |

---

## 11. Module 10 — Exit & Offboarding

> **Flow:** Employee/HR submits exit → HR approves → Asset return → Clearance → Final Settlement

### Step 10.1 — Submit Exit Request

**Path:** HR → Employees → Open Employee → Exit Tab → Submit Exit

**API:** `POST /api/v1/hrms/employees/{emp_id}/exit/submit/`

| Field | Required | Notes |
|-------|----------|-------|
| Exit Type | ✅ | RESIGNATION / TERMINATION / RETIREMENT / ABSCONDING |
| Notice Date | ✅ | Date notice was given |
| Last Working Day | ✅ | Computed from notice period (or manually set) |
| Reason | ✅ | |
| Is Immediate | ❌ | Bypass notice period |

- Publishes `EXIT_INITIATED` to Employee 360 Timeline
- Employee status → `NOTICE_PERIOD`

---

### Step 10.2 — Approve Exit Request

**Path:** HR Admin → Exit Requests → Open → Approve

**API:** `POST /api/v1/hrms/exit/{exit_request_id}/approve/`

- Publishes `NOTICE_PERIOD_START` event
- Triggers offboarding checklist creation

---

### Step 10.3 — Offboarding Checklist

Offboarding tasks generated automatically:
1. Return laptop / equipment
2. Return ID card and access cards
3. Return company phone/SIM
4. Revoke system accesses (IT to action)
5. Knowledge transfer sessions completed
6. Clearance from all departments
7. Full & Final settlement processed
8. Experience letter issued

Track via: HR → Employees → Open Employee → Offboarding Tab

---

### Step 10.4 — Asset Return

**Path:** HR → Assets → Open Employee's Assets → Return Asset

**API:** `POST /api/v1/hrms/asset-assignments/{assignment_id}/return/`

| Field | Description |
|-------|-------------|
| Return Date | When employee returned it |
| Condition | GOOD / DAMAGED / LOST |
| Remarks | Condition notes |

- Publishes `ASSET_RETURNED` to Employee 360 Timeline

---

### Step 10.5 — Complete Exit

**Path:** HR Admin → Exit Requests → Open → Complete Exit

**API:** `POST /api/v1/hrms/exit/{exit_request_id}/complete/`

- Employee status → `TERMINATED`
- Publishes `EXIT_COMPLETED` event

---

### Step 10.6 — Final Settlement

**Path:** Finance Admin → Payroll → Final Settlements → Compute Settlement

**API:** `GET/POST /api/v1/payroll/settlements/{employee_id}/`

**Settlement computes:**
| Component | Formula |
|-----------|---------|
| Salary for last month | (Basic ÷ Working Days) × Days worked |
| Leave Encashment | Remaining earned leave days × (Basic ÷ 26) |
| Gratuity | (Basic × 15 × Years) ÷ 26 (if service ≥ 5 years) |
| Bonus (if applicable) | Prorated annual statutory bonus |
| Deductions | PF, TDS, any outstanding loans |
| **Net Settlement Amount** | Sum of all components |

- Publishes `SETTLEMENT_DONE` event to Employee 360 Timeline
- System generates Final Settlement Statement (PDF)

---

### Step 10.7 — Withdraw Exit (If Employee Changes Mind)

**API:** `POST /api/v1/hrms/exit/{exit_request_id}/withdraw/`

- Only if exit has not been completed yet
- Employee status reverts to ACTIVE

---

## 12. Module 11 — Statutory Compliance Reports

> **Done by:** Finance Admin / Compliance Officer
> **Path:** Finance → Payroll → Compliance

### Step 11.1 — Form 16 (TDS Certificate)

**Path:** Finance → Payroll → Compliance → Form 16

**API:** `GET /api/v1/payroll/compliance/form-16/?employee_id={id}&year={FY}`

- Generates Form 16 (Part A + Part B) for a specific employee and financial year
- Includes: gross salary, all deductions claimed, TDS deducted per quarter
- **Issue by:** June 15 of each year
- Download as PDF

---

### Step 11.2 — PF ECR (Electronic Challan cum Return)

**Path:** Finance → Payroll → Compliance → PF ECR

**API:** `GET /api/v1/payroll/compliance/pf-ecr/?month={m}&year={y}`

- Generates EPFO-format ECR file for the month
- Contains: UAN, employee name, PF wages, employee PF, employer PF, EPS
- Upload directly to EPFO portal
- **Due:** 15th of following month

---

### Step 11.3 — ESI Return

**Path:** Finance → Payroll → Compliance → ESI Return

**API:** `GET /api/v1/payroll/compliance/esi-return/?month={m}&year={y}`

- Generates ESIC-format return file
- Contains: ESI number, gross salary, employee ESI, employer ESI
- **Due:** Half-yearly (April–September return due November 11; October–March due May 11)

---

### Step 11.4 — PT Return

**Path:** Finance → Payroll → Compliance → PT Return

**API:** `GET /api/v1/payroll/compliance/pt-return/?month={m}&year={y}&state={code}`

- Generates state-wise PT return
- **Due:** Monthly or half-yearly based on state

---

## 13. End-to-End Monthly Payroll Cycle (Summary)

> Complete step order for a flawless payroll close

```
WEEK 1 of NEW MONTH
─────────────────────────────────────────────────────────────────────────────
Day 1-3:   Employees submit IT declarations (if FY start / any changes)
Day 1-3:   HR reviews and verifies IT declarations
Day 1-3:   Finance locks verified IT declarations

LAST WEEK OF CURRENT MONTH
─────────────────────────────────────────────────────────────────────────────
Day -5:    HR audits attendance records (no missed punches / pending corrections)
Day -3:    Deadline for attendance correction request approvals
Day -2:    HR runs pre-payroll check list (Step 6.3)
           ✅ All corrections approved
           ✅ Variable pay approved
           ✅ No unlocked attendance records
           ✅ All employees have salary structure + state_code
Day -1:    Attendance records auto-locked by system (or HR locks manually)

PAYROLL DAY (typically last working day of month)
─────────────────────────────────────────────────────────────────────────────
Step 1:    HR Admin generates payroll run (Step 6.4)
           System computes all payslips
           System locks attendance (if not already)
           System publishes PAYROLL_PROCESSED timeline events

Step 2:    HR Admin reviews payroll run (Step 6.5)
           Check totals, check zero-net payslips, spot anomalies

Step 3:    HR Admin approves payroll run (Step 6.6)
           Run status: PROCESSED → APPROVED

Step 4:    Finance Admin reviews and locks run (Step 6.7)
           Run status: APPROVED → LOCKED (IMMUTABLE)
           Payslips are final. Celery sends payslip notifications.

NEXT 2-3 BUSINESS DAYS
─────────────────────────────────────────────────────────────────────────────
Step 5:    Finance processes bank transfers (net salary payments)
Step 6:    Finance remits PF challan → EPFO (by 15th)
Step 7:    Finance remits ESI challan → ESIC (by 15th)
Step 8:    Finance remits TDS challan → Tax Dept (by 7th)
Step 9:    Finance remits PT to state authority (by due date)
Step 10:   Upload PF ECR to EPFO portal
Step 11:   Employees receive payslip in ESS portal

ANNUAL (JUNE 15)
─────────────────────────────────────────────────────────────────────────────
Step 12:   Finance generates Form 16 for all employees
Step 13:   Finance issues Form 16 to all employees (by June 15)
```

---

## 14. Notification Reference

| Event | Who Gets Notified | Channel |
|-------|-----------------|---------|
| Leave Applied | Manager | In-app + Email |
| Leave Approved | Employee | In-app + Email |
| Leave Rejected | Employee | In-app + Email |
| Leave Pending (>48h) | Manager | In-app reminder |
| Correction Request Submitted | Manager | In-app |
| Correction Approved/Rejected | Employee | In-app |
| Payslip Available | Employee | In-app + Email |
| IT Declaration Deadline (7 days out) | Employee | Email |
| Document Expiry (30 days out) | HR Admin + Employee | Email |
| Payroll Run Generated | HR Admin | In-app |
| Payroll Approved | Finance Admin | In-app |
| Exit Request Submitted | HR Admin | In-app |
| Onboarding Task Overdue | HR Admin | In-app |

**Manage notification preferences:**
`GET/PATCH /api/v1/notifications/preferences/` — employees can opt-in/out per notification type and channel.

**Notification inbox:**
`GET /api/v1/notifications/inbox/` — all in-app notifications with read/unread status.

---

## 15. Role × Permission Matrix

| Permission | Platform Admin | HR Admin | HR Manager | Finance Admin | Dept Manager | Employee |
|------------|:---:|:---:|:---:|:---:|:---:|:---:|
| Create/Edit Employee | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| View All Employees | ✅ | ✅ | ✅ | ✅ | Team only | Self only |
| Approve Leave (team) | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ |
| Approve Leave (HR 2nd step) | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Apply Leave | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| View Team Attendance | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ |
| Approve Attendance Correction | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ |
| Generate Payroll Run | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ |
| Approve Payroll (HR step) | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Lock Payroll (Finance step) | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ |
| View Own Payslip | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| View All Payslips | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ |
| Download Compliance Reports | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ |
| Submit Tax Declaration | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Verify Tax Declaration (HR) | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Lock Tax Declaration (Finance) | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ |
| Initiate Onboarding | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Approve Transfer/Promotion | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Submit Exit Request | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ (self) |
| Approve Exit | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Final Settlement | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ |
| View HR Analytics | ✅ | ✅ | ✅ | ✅ | Dept only | ❌ |
| Assign / Return Assets | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Bulk Import Employees | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |

---

*End of YSS Orbit HRMS & Payroll User Manual v4.0*
*For technical/API reference see `docs/api_contracts.md`. For compliance see `docs/PAYROLL_COMPLIANCE.md`. For ops see `docs/RUNBOOK.md`.*
