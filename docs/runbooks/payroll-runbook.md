# YSS Orbit — Payroll Operations Runbook

> **Scope**: India-specific monthly payroll cycle, compliance filings, and emergency procedures.
> **Audience**: HR Admins, Finance, Payroll Ops team.

---

## 1. Monthly Payroll Cycle

### Standard Schedule (India)

| Day | Action | Owner |
|-----|--------|-------|
| 25th | Lock attendance for the month | HR Admin |
| 26th | Run payroll (generate payslips) | Payroll Admin |
| 27th | Review payslips + variance report | HR + Finance |
| 28th | Approve payroll run | Finance Manager |
| 29th | Lock payroll run | Finance Head |
| 1st (next month) | Bank transfer / NEFT | Finance |
| 7th | PF challan filing | Compliance |
| 15th | ESI challan filing | Compliance |
| 30th | PT filing (state-wise) | Compliance |

### Step-by-Step: Monthly Payroll Run

```
1. Verify attendance lock
   Admin Panel → Attendance → Attendance Lock → Lock Month [YYYY-MM]
   Confirm: All employees show is_locked = True for the period

2. Generate payslips
   POST /api/v1/payroll/runs/
   {
     "month": MM,
     "year": YYYY,
     "business_unit_id": "<UUID>"
   }
   → For BUs > 50 employees, this runs via Celery (async)
   → Poll: GET /api/v1/payroll/runs/{run_id}/ until status = GENERATED

3. Run variance report
   GET /api/v1/payroll/runs/{run_id}/reports/salary-register/
   Compare: gross_salary, tds, net_salary vs previous month
   Alert threshold: >20% variance in any employee → manual review

4. Approve
   POST /api/v1/payroll/runs/{run_id}/approve/
   → status changes to APPROVED
   → EmployeeEvent PAYROLL_APPROVED published

5. Lock
   POST /api/v1/payroll/runs/{run_id}/lock/
   → status changes to LOCKED
   → No further modifications allowed

6. Bank Statement Export
   GET /api/v1/payroll/runs/{run_id}/reports/bank-statement/
   → Download CSV with employee IFSC, account, net_salary
   → Upload to corporate net banking
```

---

## 2. Emergency Procedures

### Payroll Rollback (Post-Approval, Pre-Lock)

**Trigger**: Incorrect CTC, wrong attendance data, incorrect tax computation.

```bash
# Step 1: Rollback the payroll run (only if NOT locked)
POST /api/v1/payroll/runs/{run_id}/rollback/
{
  "reason": "Incorrect PT slab applied for Karnataka employees"
}
→ status changes back to DRAFT

# Step 2: Fix the root cause
# (e.g., correct the ProfessionalTaxSlab, fix attendance record)

# Step 3: Re-generate
# Re-run the payroll computation for affected employees
POST /api/v1/payroll/runs/{run_id}/recompute/

# Step 4: Re-approve and re-lock
```

**⚠️ WARNING**: A LOCKED payroll run CANNOT be rolled back via API.
For locked run corrections, use the admin procedure below.

### Locked Payroll Correction (Emergency)

Only accessible to Finance Head + Platform Admin.

```python
# Django shell — use only in emergencies with audit approval
from apps.payroll.models import PayrollRun
from django.utils import timezone

run = PayrollRun.objects.get(id='<run_uuid>')
# Verify current state
assert run.status == 'LOCKED', "Run is not locked"

# Unlock (creates audit trail)
run.status = 'APPROVED'
run.locked_at = None
run.locked_by_user_id = None
run.save(update_fields=['status', 'locked_at', 'locked_by_user_id', 'updated_at'])

# Log in AuditLog
from apps.audit.models import AuditLog
AuditLog.objects.create(
    action='PAYROLL_EMERGENCY_UNLOCK',
    entity_type='PayrollRun',
    entity_id=str(run.id),
    changed_by_user_id='<admin_uuid>',
    reason='<incident_ticket_reference>',
    business_unit_id=run.business_unit_id,
)
```

---

## 3. Statutory Compliance Filings

### PF (Provident Fund) — Due 7th of each month

```
Data Source: GET /api/v1/payroll/runs/{run_id}/reports/pf-esi-register/

Required fields per employee:
- UAN (Universal Account Number)
- employee_pf (employee share = 12% of basic, max ₹1,800)
- employer_pf (employer share = 12% of basic)
- employer_eps (8.33% of basic, max ₹1,250)

Filing: EPFO Unified Portal → ECR (Electronic Challan cum Return)
Deadline: 7th of following month
Late penalty: ₹5/day + 12% interest p.a.
```

### ESI (Employee State Insurance) — Due 15th of each month

```
Eligibility: Employees with gross salary ≤ ₹21,000/month

Data Source: GET /api/v1/payroll/runs/{run_id}/reports/pf-esi-register/

Required fields:
- ESI number (IP number)
- employee_esi (0.75% of gross)
- employer_esi (3.25% of gross)

Filing: ESIC portal → Monthly Contribution
Deadline: 15th of following month
```

### Professional Tax — Due last day of each month

```
State-wise rates stored in ProfessionalTaxSlab model.

Key states:
- Karnataka: ₹200/month (gross > ₹15,000)
- Maharashtra: ₹200/month (salary > ₹10,000)
- Tamil Nadu: ₹208/month (all salaried)
- Telangana: ₹200/month (gross > ₹15,000)

Filing: Respective state commercial tax portal
```

### TDS (Tax Deducted at Source) — Due 7th of each month

```
Form: 24Q (quarterly — April, July, October, January)
Challan: ITNS 281 via NSDL/TIN portal

Data from IT Declarations: GET /api/v1/payroll/tax-declarations/

TDS deposit deadline: 7th of following month
Form 24Q filing: 15th of month after quarter end
Form 16 issuance: 15th June (post FY end)
```

---

## 4. Attendance Lock Procedure

Before payroll can be generated, attendance must be locked.

```
Attendance Lock Status Check:
GET /api/v1/attendance/lock-status/?month=MM&year=YYYY&business_unit_id=<UUID>

Lock Attendance:
POST /api/v1/attendance/lock/
{
  "month": MM,
  "year": YYYY,
  "business_unit_id": "<UUID>"
}

→ Sets is_locked = True on all AttendanceRecord for the period
→ Prevents further check-in/check-out modifications
→ Payroll run blocked until lock confirmed
```

**Emergency attendance correction post-lock:**
```python
# Only for HR Admin with documented reason
from apps.hrms.models import AttendanceRecord
record = AttendanceRecord.objects.get(
    employee_id='<emp_uuid>',
    attendance_date='YYYY-MM-DD'
)
record.is_locked = False
record.save(update_fields=['is_locked'])
# Make correction, then re-lock
record.is_locked = True
record.save(update_fields=['is_locked'])
```

---

## 5. Final Settlement (FnF)

Triggered on employee exit (resignation / termination).

```
1. Exit approved by HR → status = NOTICE_PERIOD
2. Employee completes notice period → hr_terminate()
   POST /api/v1/hrms/exits/{exit_id}/terminate/

3. Generate Final Settlement:
   GET /api/v1/payroll/final-settlements/{employee_id}/

   Settlement components:
   - Last month salary (prorated)
   - Earned Leave encashment (max 30 days)
   - Gratuity (5+ years service: 15/26 × last_basic × years)
   - Notice period recovery (if short-served)
   - PF withdrawal form (Form 19 + Form 10C)

4. Approve FnF:
   POST /api/v1/payroll/final-settlements/{id}/approve/

5. Issue relieving letter + experience letter
```

---

## 6. Monitoring Checklist

Run before every payroll cycle:

- [ ] All migrations applied: `python manage.py showmigrations | grep -v '\[X\]'`
- [ ] Celery workers running: `celery -A yss_orbit inspect active`
- [ ] Redis connected: `redis-cli ping` → PONG
- [ ] No pending payroll errors: Check `PayrollRun.objects.filter(status='FAILED')`
- [ ] Attendance locked: Confirm all employees for the month
- [ ] Tax declarations reviewed: Any employee in DRAFT status?
- [ ] Salary structures assigned: `Employee.objects.filter(salary_structure=None)`

---

## 7. Common Errors and Fixes

| Error | Cause | Fix |
|-------|-------|-----|
| `AttendanceNotLocked` | Attendance not locked before payroll | Lock attendance first |
| `SalaryStructureNotAssigned` | Employee missing salary structure | Assign structure in Employee profile |
| `PTSlabNotFound` | State not in ProfessionalTaxSlab | Add state slab in Payroll Settings |
| `PayrollRun.DoesNotExist` | Run deleted or wrong BU | Verify business_unit_id in request |
| `PayrollAlreadyLocked` | Trying to modify a locked run | Use emergency unlock procedure (§2) |
| `CeleryTaskTimeout` | BU > 500 employees, payroll takes > 30min | Scale Celery workers, increase timeout |
| `TDSSlabMismatch` | New FY slab not configured | Update TDSSlab for current FY |
