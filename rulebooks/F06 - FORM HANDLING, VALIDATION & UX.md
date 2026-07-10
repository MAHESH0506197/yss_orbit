<!-- yss_orbit\rulebooks\F06 - FORM HANDLING, VALIDATION & UX.md -->
# F06 - FORM HANDLING, VALIDATION & UX

**Version:** v4.0 ENTERPRISE FINAL
**Status:** PRODUCTION LAW
**Depends On:** F01, F02 (Design System), F04 (API Integration)
**Governance Role:** Frontend Form Standards Authority

---

## RULEBOOK OWNERSHIP

| Concern | Status |
|---------|--------|
| OWNS | Form library standards, client-side validation UX, error display standards, field-level error handling, form submission UX, large form patterns |
| REFERENCES | B20 (validation ownership - backend is truth), F02 (form UI components), F07 (error display) |
| MUST NOT DUPLICATE | Backend validation rules (B20 - backend owns truth), API error handling (F04) |

---

## 1. PURPOSE

This rulebook defines **form handling and validation standards** for YSS Orbit frontend.

CRITICAL: Frontend validation is UX ONLY. The backend is the ONLY trusted validation authority (B01 §5.6, B20). Every form submission MUST be validated by the backend - frontend validation is an enhancement, not a gate.

---

## 2. CORE GOVERNANCE LAWS

### 2.1 Form Library Standard (MANDATORY)

- React Hook Form + Zod MUST be used for all forms
- Uncontrolled manual form handling is PROHIBITED
- useState-managed form state (for complex forms) is PROHIBITED - React Hook Form REQUIRED

```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const employeeSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  email: z.string().email('Enter a valid email address'),
  department: z.string().min(1, 'Department is required'),
});

type EmployeeFormData = z.infer<typeof employeeSchema>;

const form = useForm<EmployeeFormData>({
  resolver: zodResolver(employeeSchema),
  defaultValues: { name: '', email: '', department: '' },
});
```

### 2.2 Client-Side Validation (MANDATORY)

- Client-side validation MUST use Zod schemas
- Validation schemas MUST mirror backend validation rules (as UX enhancement)
- Client-side validation errors MUST display inline on the relevant field
- Client-side validation MUST run on: field blur AND form submission

Rules:
- Client-side validation MUST NOT block backend submission - it is UX feedback only
- Client-side validation errors MUST NOT be treated as final (backend may have additional rules)

### 2.3 Backend Validation Error Display (MANDATORY)

Backend validation errors MUST be displayed to the user field-by-field where possible:

```typescript
// Map backend error details to form fields:
const onSubmit = async (data: EmployeeFormData) => {
  try {
    await employeeApi.create(data);
    showSuccessToast('Employee created successfully.');
    router.push('/employees');
  } catch (err) {
    const apiError = extractApiError(err);

    if (apiError?.details) {
      // Map backend field errors to form field errors
      Object.entries(apiError.details).forEach(([field, messages]) => {
        form.setError(field as keyof EmployeeFormData, {
          type: 'server',
          message: messages[0],
        });
      });
    } else {
      showErrorToast(apiError?.message ?? 'An error occurred. Please try again.');
    }
  }
};
```

### 2.4 Error Display Standards (MANDATORY)

- Field errors MUST display below the relevant field in red/error color
- General form errors MUST display at the top of the form in an alert component
- Error messages MUST be clear and user-friendly
- Technical error details MUST NOT be displayed to users

### 2.5 Submission UX (MANDATORY)

- Submit button MUST be disabled during API call (prevent double submission)
- Loading state MUST be shown during submission
- Form MUST NOT reset before API response is confirmed
- On success: show success feedback AND redirect or reset as appropriate
- On failure: show error, preserve form data for correction

```typescript
<Button
  type="submit"
  disabled={form.formState.isSubmitting}
  loading={form.formState.isSubmitting}
>
  {form.formState.isSubmitting ? 'Saving...' : 'Save Employee'}
</Button>
```

### 2.6 Required Field Indicators (MANDATORY)

- All required fields MUST be visually marked (e.g., asterisk `*`)
- Required field legend MUST be present on forms with asterisk notation
- Optional fields SHOULD be labeled as `(optional)` for clarity

### 2.7 Large and Multi-Step Forms (MANDATORY)

- Multi-step forms MUST preserve data across steps using React Hook Form's `watch`
- Navigating back in a multi-step form MUST NOT lose previously entered data
- Progress indicators MUST be shown for multi-step forms

### 2.8 Confirmation for Destructive Actions (MANDATORY)

- Destructive actions (delete, deactivate, reset) MUST show a confirmation dialog before execution
- Confirmation dialogs MUST clearly describe the action and its consequences
- Accidental execution of destructive actions MUST be prevented

### 2.9 Accessibility (MANDATORY)

- All form fields MUST have associated `<label>` elements
- Error states MUST be communicated via ARIA attributes (`aria-invalid`, `aria-describedby`)
- Focus MUST be moved to the first error field on failed submission

---

## 3. NON-NEGOTIABLE RULES

- Forms without React Hook Form + Zod = PROHIBITED
- Frontend validation as sole validation gate = PROHIBITED
- Backend errors not displayed to users = PROHIBITED
- Double submission not prevented = HIGH violation
- Destructive action without confirmation = PROHIBITED
- Form fields without labels = PROHIBITED

---

## 4. VIOLATIONS & ENFORCEMENT

| Severity | Action |
|---------|--------|
| HIGH | Reject PR |
| MEDIUM | Fix required |

---

## 5. TESTING REQUIREMENTS

- Form validation MUST be tested (client-side and backend error mapping)
- Submission double-click prevention MUST be tested
- Backend error display MUST be tested
- Destructive action confirmation MUST be tested
- Multi-step form data preservation MUST be tested
- Any failing test MUST block deployment

---

THIS RULEBOOK IS FINALIZED. ALL CHANGES REQUIRE FRONTEND ARCHITECT REVIEW.
