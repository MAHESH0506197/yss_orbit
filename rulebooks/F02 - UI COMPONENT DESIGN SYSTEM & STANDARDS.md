<!-- yss_orbit\rulebooks\F02 - UI COMPONENT DESIGN SYSTEM & STANDARDS.md -->
# F02 - UI COMPONENT DESIGN SYSTEM & STANDARDS

**Version:** v4.0 ENTERPRISE FINAL
**Status:** PRODUCTION LAW
**Depends On:** F01 (Frontend Architecture), F06 (Forms & UX)
**Governance Role:** UI Design System Authority

---

## RULEBOOK OWNERSHIP

| Concern | Status |
|---------|--------|
| OWNS | Component library standards, design token governance, naming conventions, component composition rules, visual hierarchy, responsive design standards, reusable component patterns |
| REFERENCES | F01 (frontend architecture), F06 (form components), F07 (loading/error states) |
| MUST NOT DUPLICATE | Frontend architecture (F01), form validation (F06), error handling (F07) |

---

## 1. PURPOSE

This rulebook defines **UI component design system standards** for YSS Orbit.

It establishes:
- Reusable component library standards
- Design token governance
- Component composition and naming rules
- Visual consistency requirements

All UI development MUST follow these standards.

---

## 2. CORE GOVERNANCE LAWS

### 2.1 Design System Usage (MANDATORY)

- A shared component library MUST be established and maintained
- Raw HTML elements MUST NOT be used for standard UI patterns (buttons, inputs, modals, tables, alerts) - the design system components MUST be used
- Custom one-off components that duplicate existing design system components are PROHIBITED

### 2.2 Design Token Governance (MANDATORY)

- Colors, spacing, typography, breakpoints, and border-radius MUST be defined as design tokens
- Hardcoded color values (e.g., `#3b82f6`, `red`) in component styles are PROHIBITED
- Inline styles MUST NOT be used for design-system-governed properties

```typescript
// PROHIBITED:
<div style={{ color: '#3b82f6', marginTop: '16px' }}>...</div>

// REQUIRED:
<div className="text-primary mt-4">...</div>
// where text-primary and mt-4 are design system tokens
```

### 2.3 Component Naming (MANDATORY)

- Components MUST be named in `PascalCase`
- Component names MUST be descriptive and self-documenting
- Abbreviations in component names are PROHIBITED
- Generic names (`Component`, `Item`, `Box`) are PROHIBITED without domain context

```typescript
// PROHIBITED:
const Comp = () => <div>...</div>
const Item = () => <div>...</div>

// REQUIRED:
const EmployeeListCard = () => <div>...</div>
const PayrollSummaryTable = () => <div>...</div>
```

### 2.4 Component Composition (MANDATORY)

- Components MUST be composed from smaller, single-responsibility sub-components
- Monolithic components with mixed concerns are PROHIBITED
- Props MUST be typed explicitly using TypeScript interfaces or types

```typescript
// REQUIRED:
interface EmployeeCardProps {
  employee: Employee;
  onEdit: (id: string) => void;
  onDeactivate: (id: string) => void;
}

const EmployeeCard: React.FC<EmployeeCardProps> = ({ employee, onEdit, onDeactivate }) => {
  return (
    <Card>
      <EmployeeCardHeader employee={employee} />
      <EmployeeCardActions onEdit={() => onEdit(employee.id)} onDeactivate={() => onDeactivate(employee.id)} />
    </Card>
  );
};
```

### 2.5 Responsive Design (MANDATORY)

- All UI components MUST be responsive
- Mobile-first design approach is REQUIRED
- Fixed-width breakpoints MUST follow the design system breakpoints
- Non-responsive components are PROHIBITED in production

### 2.6 Accessibility (MANDATORY)

- All interactive components MUST include appropriate ARIA attributes
- Focus management MUST be handled correctly (especially for modals and dialogs)
- Color contrast ratios MUST meet WCAG 2.1 AA standards
- Components MUST be usable with keyboard navigation alone

### 2.7 Component Documentation (MANDATORY)

- All shared components MUST have JSDoc comments
- Component props MUST be documented
- Usage examples MUST be provided for complex components

### 2.8 Icon Usage (MANDATORY)

- Icons MUST come from the approved icon library (e.g., Lucide Icons or Heroicons)
- Custom SVG icons MUST be reviewed and added to the design system
- Random external icon downloads are PROHIBITED

### 2.9 Table Components (MANDATORY)

- All data tables MUST support: sorting, filtering, pagination
- Tables MUST handle empty states explicitly (see F07)
- Tables displaying tenant-owned data MUST only show data for the current BusinessUnit

### 2.10 Form Components (MANDATORY)

- Form field components MUST use the design system input components
- Custom form styling that conflicts with the design system is PROHIBITED
- Form error display MUST follow F06 standards

---

## 3. NON-NEGOTIABLE RULES

- Hardcoded color values in components = PROHIBITED
- Inline styles overriding design tokens = PROHIBITED
- Monolithic components = PROHIBITED
- Missing TypeScript prop types = PROHIBITED
- Non-responsive components = PROHIBITED
- Missing accessibility attributes = PROHIBITED

---

## 4. VIOLATIONS & ENFORCEMENT

| Severity | Action |
|---------|--------|
| HIGH | Reject PR |
| MEDIUM | Fix required |

---

## 5. TESTING REQUIREMENTS

- All shared components MUST have unit tests
- Visual regression tests REQUIRED for design system components
- Accessibility tests REQUIRED for all interactive components
- Any failing test MUST block deployment

---

THIS RULEBOOK IS FINALIZED. ALL CHANGES REQUIRE FRONTEND ARCHITECT REVIEW.
