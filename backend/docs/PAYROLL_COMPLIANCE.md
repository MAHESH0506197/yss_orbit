# YSS Orbit — India Payroll Statutory Compliance

> **Audience:** Payroll team, Finance, Compliance officers
> **Jurisdiction:** India (Central + State laws)
> **Last Updated:** June 2026 (FY 2026–27)

---

## 1. Provident Fund (PF) — EPF Act 1952

### Rates
| Component | Employee Contribution | Employer Contribution |
|-----------|--------------------|-------------------|
| EPF | 12% of Basic+DA | 3.67% of Basic+DA (to EPF) |
| EPS | — | 8.33% of Basic+DA (to Pension, capped at ₹15,000 Basic) |
| EDLI | — | 0.5% of Basic+DA (insurance) |

### Implementation in `SalaryComputationService`
```python
# PF is capped at ₹1,800/month (12% of ₹15,000 ceiling)
PF_WAGE_CEILING = Decimal("15000.00")
PF_EMPLOYEE_RATE = Decimal("0.12")
pf_wages = min(basic_salary, PF_WAGE_CEILING)
employee_pf = (pf_wages * PF_EMPLOYEE_RATE).quantize(RUPEE)  # max ₹1,800

# Contractors (worker_type = CONTRACTOR) are EXCLUDED from PF
if worker_type == 'CONTRACTOR':
    employee_pf = Decimal("0")
```

### Applicability
- **Applicable:** All employees earning basic salary ≤ ₹15,000/month (mandatory)
- **Optional:** Employees earning > ₹15,000 may voluntarily contribute (employer also contributes)
- **Excluded:** Contractors, consultants, interns

### Filing
- **EPFO ECR:** Monthly electronic challan return — due by 15th of following month
- **Annual Return (Form 3A, 6A):** Due by April 30 each year
- **UAN management:** Employees must have UAN linked to Aadhaar

---

## 2. Employee State Insurance (ESI) — ESIC Act 1948

### Rates
| Component | Rate | Ceiling |
|-----------|----|---------|
| Employee contribution | 0.75% of gross salary | Gross ≤ ₹21,000/month |
| Employer contribution | 3.25% of gross salary | Gross ≤ ₹21,000/month |

### Implementation
```python
ESI_GROSS_CEILING = Decimal("21000.00")
ESI_EMPLOYEE_RATE = Decimal("0.0075")
ESI_EMPLOYER_RATE = Decimal("0.0325")

if gross_salary <= ESI_GROSS_CEILING:
    employee_esi = (gross_salary * ESI_EMPLOYEE_RATE).quantize(RUPEE)
else:
    employee_esi = Decimal("0")   # Above ceiling — no ESI
```

### Applicability
- Employees with gross salary ≤ ₹21,000/month in establishments with ≥ 10 employees
- Contractors are excluded
- Once an employee's salary crosses ₹21,000, ESI contributions stop for that contribution period

### Benefits (Employee)
- Medical care (OPD + IPD) for employee and family
- Sickness benefit, maternity benefit, disability benefit, dependent benefit

### Filing
- **ESI Return:** Half-yearly (April–September & October–March)
- **Challan:** Monthly by 15th of following month

---

## 3. Professional Tax (PT)

### State-wise Slabs

| State | Slab | Monthly PT |
|-------|------|-----------|
| Karnataka | Gross ≥ ₹25,000 | ₹200/month |
| Karnataka | Gross 15,001–24,999 | ₹150/month |
| Karnataka | Gross ≤ ₹15,000 | Nil |
| Maharashtra | Salary ≥ ₹20,000 | ₹200/month (Feb: ₹300) |
| Maharashtra | Salary 10,001–20,000 | ₹175/month |
| Andhra Pradesh | Salary ≥ ₹20,000 | ₹200/month |
| Tamil Nadu | Salary > ₹21,000 | ₹208/month (half-yearly) |
| West Bengal | Salary ≥ ₹40,001 | ₹200/month |
| Telangana | Salary ≥ ₹20,000 | ₹200/month |
| Gujarat | Salary ≥ ₹12,000 | ₹200/month |
| Nil | States without PT | ₹0 |

States with **no PT:** Delhi, Haryana, Rajasthan, UP, MP, HP, Uttarakhand, J&K.

### Implementation
```python
# PT slab lookup from ProfessionalTaxSlab table (state + gross range)
pt_slab = ProfessionalTaxSlab.objects.filter(
    business_unit_id=bu_id,
    state_code=employee.state_code,
    min_salary__lte=gross_salary,
    max_salary__gte=gross_salary,
).first()
pt_amount = pt_slab.monthly_amount if pt_slab else Decimal("0")
```

### Filing
- Monthly or half-yearly based on state (deducted from employee, employer remits)
- Annual certificate to be issued to employees (PT paid certificate)

---

## 4. Tax Deducted at Source (TDS) — Section 192

### Old vs New Regime

| Feature | Old Regime | New Regime (Default from FY24-25) |
|---------|-----------|----------------------------------|
| Standard Deduction | ₹50,000 | ₹75,000 (budget 2024) |
| 80C (ELSS, PPF, LIC) | ₹1.5L deduction | ❌ Not applicable |
| 80D (Health Insurance) | Applicable | ❌ Not applicable |
| HRA Exemption | Applicable | ❌ Not applicable |
| Tax Slabs | 5–30% | Revised slabs (lower rates) |

### New Regime Tax Slabs (FY 2026-27)
| Income Range | Tax Rate |
|-------------|---------|
| ₹0 – ₹4,00,000 | Nil |
| ₹4,00,001 – ₹8,00,000 | 5% |
| ₹8,00,001 – ₹12,00,000 | 10% |
| ₹12,00,001 – ₹16,00,000 | 15% |
| ₹16,00,001 – ₹20,00,000 | 20% |
| ₹20,00,001 – ₹24,00,000 | 25% |
| Above ₹24,00,000 | 30% |
| Rebate u/s 87A | Up to ₹60,000 for income ≤ ₹12L |

### Implementation in `SalaryComputationService`
```python
# Monthly TDS = (Annualised Taxable Income Tax) / 12
# Step 1: Annualise current month gross
annualised_gross = monthly_gross_salary * 12

# Step 2: Apply deductions (old regime)
if regime == TaxDeclaration.Regime.OLD:
    deductions = min(declared_80c, 150000) + standard_deduction
    taxable_income = max(0, annualised_gross - deductions)
else:  # NEW regime
    taxable_income = max(0, annualised_gross - 75000)  # Only standard deduction

# Step 3: Apply slabs and divide by 12
annual_tax = compute_tax_from_slabs(taxable_income, regime)
monthly_tds = (annual_tax / 12).quantize(RUPEE)
```

### Filing
- **Form 24Q:** TDS return for salaries — quarterly (July 31, Oct 31, Jan 31, May 31)
- **Form 16:** Annual TDS certificate — issued to employees by June 15
- **Challan 281:** Monthly TDS remittance — by 7th of following month (March: by April 30)

---

## 5. Labour Welfare Fund (LWF)

| State | Employee | Employer | Frequency |
|-------|---------|---------|-----------|
| Karnataka | ₹20/half-year | ₹40/half-year | June 30 & Dec 31 |
| Maharashtra | ₹6/month | ₹12/month | Monthly |
| Andhra Pradesh | ₹30/year | ₹70/year | Dec 31 |
| Tamil Nadu | ₹10/year | ₹20/year | Dec 31 |

### Implementation
```python
# LWF is deducted in the applicable months (June/December for Karnataka)
if state_code == 'KA' and month in [6, 12]:
    lwf_amount = Decimal("20.00")
elif state_code == 'MH':
    lwf_amount = Decimal("6.00")
else:
    lwf_amount = Decimal("0.00")
```

---

## 6. Gratuity (Payment of Gratuity Act 1972)

- **Eligibility:** 5 years of continuous service
- **Formula:** `(Basic + DA) × 15 × Years of Service / 26`
- **Maximum:** ₹20 lakhs (tax-exempt)
- **Accounting:** Provisioned monthly but paid on exit

```python
# Gratuity computation (in FinalSettlementService)
years_of_service = (exit_date - date_of_joining).days / 365.25
if years_of_service >= 5:
    gratuity = (basic_salary * 15 * years_of_service) / 26
    gratuity = min(gratuity, Decimal("2000000.00"))  # ₹20L cap
```

---

## 7. Statutory Bonus (Payment of Bonus Act 1965)

- **Applicability:** Employees earning up to ₹21,000/month
- **Minimum Bonus:** 8.33% of annual wages (or ₹100 for the year, whichever higher)
- **Maximum Bonus:** 20% of annual wages
- **Wage ceiling for computation:** ₹7,000/month

```python
BONUS_WAGE_CEILING = Decimal("7000.00")
MIN_BONUS_RATE = Decimal("0.0833")
bonus_wages = min(monthly_basic, BONUS_WAGE_CEILING) * 12  # Annual
statutory_bonus = (bonus_wages * MIN_BONUS_RATE).quantize(RUPEE)
```

---

## 8. Compliance Calendar

| Month | Task |
|-------|------|
| April | Form 24Q (Q4) due May 31; Form 16 to employees by June 15; LWF (AP/TN) |
| Every month | PF ECR by 15th; ESI challan by 15th; TDS challan by 7th |
| June | LWF (KA) deduction; Form 24Q (Q1) due July 31 |
| September | ESI half-year return due; Form 24Q (Q2) due Oct 31 |
| December | LWF (KA, AP, TN) deduction; Form 24Q (Q3) due Jan 31 |
| March | FY year-end: IT declaration collection; Regime switch deadline |
