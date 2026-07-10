<!-- yss_orbit\rulebooks\F07 - ERROR HANDLING, LOADING STATES & FEEDBACK.md -->
# F07 - ERROR HANDLING, LOADING STATES & FEEDBACK

**Version:** v4.0 ENTERPRISE FINAL
**Status:** PRODUCTION LAW
**Depends On:** F01, F04 (API Integration), F06 (Forms)
**Governance Role:** Frontend Error & Feedback Authority

---

## RULEBOOK OWNERSHIP

| Concern | Status |
|---------|--------|
| OWNS | Loading state patterns, skeleton screens, error boundary usage, API error display, toast/notification standards, empty state handling, retry patterns |
| REFERENCES | F04 (API error structure), F06 (form error display), B20 (backend error contract) |
| MUST NOT DUPLICATE | Backend error contract (B20), API error format (X02) |

---

## 1. PURPOSE

This rulebook defines **error handling, loading states, and user feedback standards** for the frontend.

All user-facing states MUST provide clear, informative, and safe feedback.

---

## 2. CORE GOVERNANCE LAWS

### 2.1 Loading States (MANDATORY)

- All async operations MUST show a loading indicator
- Skeleton screens MUST be used for initial page/section loads
- Spinners MUST be used for inline operations (button loading, inline refresh)
- Content MUST NOT flash between loading and loaded states

```typescript
if (isLoading) return <EmployeeListSkeleton />;
if (error) return <ErrorState message={getErrorMessage(error)} onRetry={refetch} />;
if (!data?.length) return <EmptyState message="No employees found." />;
return <EmployeeList employees={data} />;
```

### 2.2 Error Boundaries (MANDATORY)

- React Error Boundaries MUST wrap all page-level components
- Component-level crashes MUST NOT crash the entire application
- Error boundaries MUST display a safe fallback UI with a retry option
- Error boundaries MUST log the error with `trace_id` if available

```typescript
class PageErrorBoundary extends React.Component {
  state = { hasError: false };
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch(error: Error) { logger.error('Page crashed', { error }); }
  render() {
    if (this.state.hasError) return <ErrorFallback onRetry={() => this.setState({ hasError: false })} />;
    return this.props.children;
  }
}
```

### 2.3 API Error Display (MANDATORY)

- 400 (validation) → Display field errors or general validation message
- 401 (unauthorized) → Redirect to login with session-expiry message (F05)
- 403 (forbidden) → Display "You do not have permission to perform this action."
- 404 (not found) → Display "The requested resource was not found."
- 409 (conflict) → Display the specific conflict message from API
- 429 (rate limit) → Display "Too many requests. Please wait a moment before trying again."
- 500 (server error) → Display "An unexpected error occurred. Please try again later. If the issue persists, contact support." + show `trace_id` for user to report

Raw API error messages MUST NOT be shown directly to users unless explicitly safe.

### 2.4 Toast / Notification Standards (MANDATORY)

- Success actions (create, update, delete) MUST show a success toast
- Error actions MUST show an error toast for non-form errors
- Toast messages MUST be concise (< 80 characters)
- Multiple simultaneous toasts MUST be queued, not stacked indefinitely
- Toasts MUST auto-dismiss (success: 3s, error: 5s)

### 2.5 Empty State Handling (MANDATORY)

- All list/table views MUST handle empty data explicitly with a user-friendly empty state
- Empty state MUST include: icon or illustration, descriptive message, optional call-to-action

```typescript
<EmptyState
  icon={<UsersIcon />}
  message="No employees found."
  description="Add your first employee to get started."
  action={<Button onClick={handleCreate}>Add Employee</Button>}
/>
```

### 2.6 Retry Patterns (MANDATORY)

- Network errors and 5xx errors MUST display a retry button
- Retry MUST re-execute the failed operation - not reload the entire page
- Retry attempts MUST NOT be infinite - show a "contact support" message after 3 retries

### 2.7 Safe Error Messages (MANDATORY)

Frontend error messages MUST:
- Be written in plain user-facing language
- NEVER expose internal error codes, stack traces, SQL, or system paths
- Include `trace_id` only in 500 errors (for user to report to support)

---

## 3. NON-NEGOTIABLE RULES

- Missing loading state on async operation = PROHIBITED
- Missing error boundary on page-level component = PROHIBITED
- Raw API error in user-facing message = PROHIBITED
- Missing empty state on list views = PROHIBITED
- Missing retry on recoverable errors = HIGH violation

---

## 4. VIOLATIONS & ENFORCEMENT

| Severity | Action |
|---------|--------|
| HIGH | Reject PR |
| MEDIUM | Fix required |

---

## 5. TESTING REQUIREMENTS

- Loading states MUST be tested (verify skeleton appears)
- Error boundary fallback MUST be tested
- Error message display per HTTP status code MUST be tested
- Empty state MUST be tested
- Retry behavior MUST be tested
- Any failing test MUST block deployment

---

THIS RULEBOOK IS FINALIZED. ALL CHANGES REQUIRE FRONTEND ARCHITECT REVIEW.
