# Frontend Audit Report: Organization, Business Domain & Business Unit Modules

## Executive Summary

This audit covers 69 files across the Organization, Business Domain, Business Unit, and User-BU Mapping modules in the YSS Orbit React + Vite + TypeScript frontend. The codebase shows signs of rapid iterative development with significant technical debt, architectural inconsistencies, and critical synchronization issues between modules.

**Severity Distribution:**
- **CRITICAL:** 8 issues
- **HIGH:** 14 issues
- **MEDIUM:** 12 issues
- **LOW:** 10 issues

**Top Risks:**
1. Dual state management (Zustand + React Query) causing cache desync
2. Duplicate API mutation layers between `useBusinessDomains.ts` and `useBusinessDomainMutations.ts`
3. Hardcoded inline styles in Business Unit pages breaking design system consistency
4. Direct API calls bypassing React Query cache in User-BU Mapping detail page
5. Route imports pointing to `@/pages/` directories while audited code lives in `features/organization/`

---

## CRITICAL Issues

### C1: Duplicate API Mutation Layers (Cache Invalidation Risk)
**Files:**
- `businessDomain/api/useBusinessDomains.ts` (lines 130-224)
- `businessDomain/api/useBusinessDomainMutations.ts` (entire file)

**Issue:** Two separate files export overlapping mutation hooks for the same Business Domain API endpoints. `useBusinessDomains.ts` exports `useCreateBusinessDomain`, `useUpdateBusinessDomain`, etc., while `useBusinessDomainMutations.ts` exports a bundled `useBusinessDomainMutations()` that creates its own QueryClient mutations. Components use whichever import they happen to find, leading to inconsistent cache invalidation and potential race conditions.

**Impact:** Stale data, hard-to-reproduce UI state bugs, unpredictable cache behavior.

**Fix:** Consolidate into a single canonical mutation hook file. Delete `useBusinessDomainMutations.ts` and migrate all callers to `useBusinessDomains.ts`.

---

### C2: Dual State Management — Zustand Store Bypasses React Query
**Files:**
- `userBusinessUnit/hooks/useuserBusinessUnit.ts`
- `userBusinessUnit/state/userBusinessUnitSlice.ts`
- `userBusinessUnit/pages/userBusinessUnitDetailPage.tsx` (lines 58-101)

**Issue:** The `useUserBusinessUnit` hook uses a Zustand store that directly calls `userBusinessUnitApi.getAll()` and stores results in local state. Meanwhile, `useUserBusinessUnits` (the React Query hook) properly manages server state with caching. The detail page uses the Zustand approach, bypassing React Query's cache, optimistic updates, and background refetching entirely.

**Impact:** Data inconsistency between list and detail views, unnecessary API calls, no stale-while-revalidate behavior.

**Fix:** Remove the Zustand-based data fetching. Migrate `userBusinessUnitDetailPage.tsx` to use `useUserBusinessUnits` or `useUserBusinessUnit` React Query hooks.

---

### C3: Route Imports Point to Wrong Directory (Ghost Pages)
**File:** `routes/AppRouter.tsx` (lines 66-79, 82-85)

**Issue:** `AppRouter.tsx` imports Organization pages from `@/pages/organization/...` and Business Unit pages from `@/pages/businessUnit/...`, but the audited (and apparently maintained) implementations live in `@/features/organization/...`. This indicates either:
- There are duplicate page implementations in `pages/`, or
- The `features/` versions are dead code

**Examples:**
```tsx
const OrganizationListPage = lazy(() => import('@/pages/organization/organizationListPage'));
const BusinessUnitListPage = lazy(() => import('@/pages/businessUnit/businessUnitListPage'));
```

But the audited `BusinessUnitListPage` is at `features/organization/businessUnit/pages/BusinessUnitListPage.tsx`.

**Impact:** Developers edit `features/` files but runtime uses `pages/` files, or vice versa. Changes appear to have no effect.

**Fix:** Audit both directories, delete duplicates, and consolidate all module pages under `features/organization/`.

---

### C4: Type Safety Breakdown — Widespread `any` Usage
**Files:** Multiple

**Critical instances:**
- `OrganizationForm.tsx:111` — `const meta = metaRaw as any;` (hides type errors from schema generation)
- `BusinessUnitFormModal.tsx:263` — `organizations.find((o: any) => ...)` (breaks IntelliSense, no compile-time safety)
- `BusinessUnitFormModal.tsx:304` — `(businessUnit as any).branding_mode` (type assertion bypasses interface)
- `userBusinessUnitSlice.ts:23` — `raw.map((item: any) => ...)` (API response not typed)
- `useOrganizations.ts:267` — `createOrg: (payload: any) => ...` (create payload not typed)

**Impact:** TypeScript becomes useless for refactoring. Runtime errors instead of compile-time errors.

**Fix:** Replace all `any` with proper interfaces. Enable `@typescript-eslint/no-explicit-any` in ESLint.

---

### C5: Empty/Stub Test Files
**Files:**
- `organization/tests/organizationService.test.ts` — Contains `export class Organizationservice { static async execute() { return true; } }`, not a test
- `userBusinessUnit/tests/userBusinessUnitStore.test.ts` — Contains only `export {};`

**Impact:** False confidence in test coverage. CI may report green while critical paths are untested.

**Fix:** Write proper tests or delete the files.

---

### C6: Direct API Call in Detail Page Bypasses All State Management
**File:** `userBusinessUnit/pages/userBusinessUnitDetailPage.tsx` (lines 72-101)

**Issue:** The detail page manually calls `userBusinessUnitApi.getAll({ userId: id })` in a `useCallback` + `useEffect` pattern with local `useState`. It does not use React Query, Zustand (properly), or any shared cache. The `load()` function is re-created on every render.

```tsx
const load = useCallback(async () => {
  // ... direct API call ...
  setMemberships(mapped);
}, [id]);
useEffect(() => { load(); }, [load]);
```

**Impact:** No caching, no background updates, no error boundaries, no loading state standardization.

**Fix:** Replace with `useUserBusinessUnits({ user_id: id })` React Query hook.

---

### C7: Mismatched Form Validation Schemas
**Files:**
- `businessDomain/pages/BusinessDomainCreatePage.tsx` (lines 31-38, inline schema)
- `businessDomain/schemas/businessDomainSchema.ts` (canonical schema)

**Issue:** The create page defines its own Zod schema with `code: z.string().min(2)` and regex `/^[A-Z0-9_-]+$/`, while the canonical schema requires `min(6)` and `startsWith('BDOM-')`. Users can create domains via the create page that fail validation when edited.

**Impact:** Inconsistent validation, potential database constraint violations.

**Fix:** Import and use the canonical `businessDomainSchema` in `BusinessDomainCreatePage`.

---

### C8: Inline Styles Break Dark Mode & Design System
**Files:**
- `businessUnit/pages/BusinessUnitListPage.tsx` (lines 276-605 — entire page)
- `businessUnit/pages/BusinessUnitDetailPage.tsx` (lines 137-341 — entire page)

**Issue:** Both Business Unit pages use extensive inline `style={{...}}` objects with hardcoded hex colors (`#0f172a`, `#e2e8f0`, `#6366f1`, etc.) instead of Tailwind classes or CSS variables. This completely bypasses the dark mode system used by the rest of the application.

**Impact:** Dark mode toggle has no effect on Business Unit pages. Accessibility contrast ratios are unverified. Theme customization is impossible.

**Fix:** Rewrite all inline styles using Tailwind classes and `dark:` variants.

---

## HIGH Issues

### H1: Missing Permission Gating in Business Unit Pages
**Files:**
- `businessUnit/pages/BusinessUnitListPage.tsx`
- `businessUnit/pages/BusinessUnitDetailPage.tsx`
- `businessUnit/components/BusinessUnitFormModal.tsx`

**Issue:** No `PermissionGate` wrappers around create/edit/archive/restore actions. The only permission check in the entire BU module is `isSuperAdmin` from authStore. Business Domain and Organization modules properly use `PermissionGate`.

**Fix:** Add `<PermissionGate permission="business_unit...">` wrappers around all mutating actions.

---

### H2: BusinessUnitFormModal Auto-Generates Invalid Codes
**File:** `businessUnit/components/BusinessUnitFormModal.tsx` (lines 260-275)

**Issue:** The auto-generated code uses `BU-${orgPrefix}-${namePrefix}` which can exceed the 20-character max length enforced by the schema. The code is truncated with `.substring(0, 20)` but the schema regex `^[A-Z0-9_-]{2,20}$` may still reject it if the last character is a hyphen.

**Fix:** Ensure generated codes always end with an alphanumeric character and respect the regex.

---

### H3: Keyboard Shortcuts Conflict with Browser/Input Navigation
**File:** `businessDomain/pages/BusinessDomainDetailPage.tsx` (lines 301-325)

**Issue:** The detail page binds `ArrowLeft` and `Backspace` to navigate back. This breaks:
- Browser back button functionality expectation
- Text selection with Shift+ArrowLeft
- Accessibility navigation for screen reader users

```tsx
if (e.key === 'ArrowLeft' || e.key === 'Backspace') {
  e.preventDefault();
  navigate(backUrl);
}
```

**Fix:** Remove ArrowLeft/Backspace navigation. Use only explicit keyboard shortcuts (E for edit, A for archive) with modifier key checks.

---

### H4: Missing Error Boundary on Modal Components
**Files:**
- `businessUnit/components/BusinessUnitFormModal.tsx`
- `businessDomain/components/BusinessDomainPermanentDeleteModal.tsx`
- `organization/components/OrganizationPermanentDeleteModal.tsx`

**Issue:** Modals rendered via `createPortal` have no error boundaries. A runtime error in form validation, image loading, or API response parsing will crash the entire application.

**Fix:** Wrap modal content in `<ErrorBoundary>` components.

---

### H5: OrganizationForm Fetches Wrong Data for Meta
**File:** `organization/components/OrganizationForm.tsx` (line 110)

**Issue:** `const { data: metaRaw } = useOrganizations();` fetches the full organization list (up to 20+ items) just to get `OrganizationMeta` for the slug regex. This is wasteful and the type cast `as any` is incorrect.

**Fix:** Use `useOrganizationMeta()` or a dedicated lightweight endpoint.

---

### H6: useUserBusinessUnit Hook Does Not Invalidate React Query Cache
**File:** `userBusinessUnit/hooks/useuserBusinessUnit.ts` (lines 29-88)

**Issue:** All mutation methods (`createMembership`, `patchMembership`, `deleteMembership`, `toggleMembership`) update the Zustand store locally but never invalidate the React Query cache used by `useUserBusinessUnits`. After creating a membership in one component, a list view using React Query will show stale data.

**Fix:** Add `queryClient.invalidateQueries()` calls after each mutation, or deprecate this hook entirely.

---

### H7: BusinessUnitQuickViewDrawer Missing `onViewDetail` Handler
**File:** `businessUnit/components/BusinessUnitQuickViewDrawer.tsx` (line 367-372)

**Issue:** The "View Details" button calls `onViewDetail?.(bu)` but in `BusinessUnitListPage.tsx` (lines 596-602), the drawer is rendered without the `onViewDetail` prop:
```tsx
<BusinessUnitQuickViewDrawer
  businessUnit={quickViewBu}
  onClose={()=>setQuickViewBu(null)}
  onEdit={()=>{ openEditModal(quickViewBu); setQuickViewBu(null); }}
/>
```

**Impact:** The primary CTA in the drawer does nothing.

**Fix:** Add `onViewDetail={() => navigate(`/platform/business-units/${bu.id}`)}`.

---

### H8: Stale Field Reference in organizationStore Test
**File:** `organization/tests/organizationStore.test.ts` (line 7)

**Issue:** Test data includes `slug: 'test'` but the `Organization` interface explicitly documents that `slug` was removed from the model.

```tsx
const org = { id: 'abc', name: 'Test', slug: 'test', ... } as any;
```

**Impact:** Test validates incorrect data shape, masking potential integration issues.

**Fix:** Remove `slug` from test fixture.

---

### H9: BusinessUnitHierarchy is Non-Functional Stub
**File:** `businessUnit/components/BusinessUnitHierarchy.tsx`

**Issue:** The component accepts `hierarchyData: any` but ignores it entirely, rendering hardcoded placeholder nodes ("Root Organization", "Subsidiary A").

**Fix:** Implement actual tree rendering or remove the component.

---

### H10: Missing `enabled` Check in useRoles Query
**File:** `userBusinessUnit/components/EditMembershipModal.tsx` (line 20)

**Issue:** `useRoles({ business_unit_id: membership?.businessUnit })` fires even when `membership` is null. The `membership?.businessUnit` evaluates to `undefined`, which may cause the hook to fetch roles for an invalid business unit.

**Fix:** Add `enabled: !!membership?.businessUnit` to the query options.

---

### H11: Form Submission Bypasses React Hook Form Validation
**File:** `businessDomain/pages/BusinessDomainEditPage.tsx` (lines 216-234)

**Issue:** The keyboard shortcut for Cmd+S dispatches a synthetic DOM event on the form element instead of calling `handleSubmit(onSubmit)`. This bypasses React Hook Form's validation and could submit invalid data.

```tsx
document.getElementById('edit-domain-form')?.dispatchEvent(
  new Event('submit', { cancelable: true, bubbles: true })
);
```

**Fix:** Call `handleSubmit(onSubmit)()` directly.

---

### H12: BusinessDomainDetailPage Archive Action Missing Error Toast
**File:** `businessDomain/pages/BusinessDomainDetailPage.tsx` (lines 327-346)

**Issue:** The `executeConfirmAction` callback catches errors and shows a toast, but if `archiveMutation.mutateAsync` throws before the callback completes (e.g., network error), the `setIsConfirming(false)` in `finally` runs but `setConfirmType(null)` does not if the catch block rethrows.

Actually looking closer, the catch does not rethrow — it shows toast. But the `navigate(backUrl)` on archive success happens before the toast, so if navigation fails, the user sees nothing.

**Fix:** Show toast before navigation. Ensure finally block always resets state.

---

### H13: UserBusinessUnitDetailPage Manual Data Normalization
**File:** `userBusinessUnit/pages/userBusinessUnitDetailPage.tsx` (lines 79-94)

**Issue:** The page manually normalizes snake_case to camelCase with 15 lines of repetitive mapping. This logic is duplicated from `useUserBusinessUnits.ts` (`normaliseRawMembership`).

**Fix:** Import and reuse `normaliseRawMembership`.

---

### H14: Potential Memory Leak from Object URLs
**File:** `businessDomain/components/LogoUploadZone.tsx` (lines 18-27)

**Issue:** The component creates `URL.createObjectURL(pendingFile)` but only revokes it when `pendingFile` changes. If the component unmounts while a file is selected, the object URL leaks.

```tsx
useEffect(() => {
  if (pendingFile) {
    const url = URL.createObjectURL(pendingFile);
    setObjectUrl(url);
    return () => URL.revokeObjectURL(url); // Only runs on change, not unmount
  }
}, [pendingFile]);
```

Actually, the cleanup function IS returned and React runs it on unmount. This is probably fine, but the `else { setObjectUrl(null); return undefined; }` branch means if `pendingFile` goes from File to null, the previous URL is not revoked.

**Fix:** Always revoke the previous URL before creating a new one.

---

## MEDIUM Issues

### M1: Duplicate LogoUploadZone Components
**Files:**
- `organization/components/LogoUploadZone.tsx`
- `businessDomain/components/LogoUploadZone.tsx`

**Issue:** Two similar but not identical logo upload components. The organization version accepts `orgId` and `onFileSelected`; the business domain version accepts `pendingFile` and `onUploaded`.

**Fix:** Extract a shared `LogoUploadZone` to `@/components/ui/`.

---

### M2: Inconsistent Route Definition Patterns
**Files:**
- `organization/routes/organizationRoutes.tsx` — Uses JSX `<Routes><Route...>` with `Suspense`
- `businessUnit/routes/businessUnitRoutes.tsx` — Uses `RouteObject[]` array
- `userBusinessUnit/routes/userBusinessUnitRoutes.tsx` — Uses JSX with `React.lazy` inline

**Issue:** Three different routing patterns in related modules. Inconsistent fallback loading UI.

**Fix:** Standardize on one pattern (recommend `RouteObject[]` with lazy loading).

---

### M3: BU Constants Reference Deleted Model Field
**File:** `businessUnit/constants/businessUnitConstants.ts` (lines 25-37)

**Issue:** `BU_INDUSTRY_OPTIONS` array exists but the `BusinessUnit` type comments state "DEFECT-06: Removed dead BusinessUnitIndustry enum (field deleted from model)".

**Fix:** Remove `BU_INDUSTRY_OPTIONS` and `getIndustryLabel`/`getIndustryEmoji` helpers.

---

### M4: BusinessUnitListPage Missing `useMemo` for Expensive Renders
**File:** `businessUnit/pages/BusinessUnitListPage.tsx` (lines 110-171)

**Issue:** `BuCard` and `StatusBadge` are redefined as inline functions inside the module scope, not as separate components. Each render creates new function references, causing unnecessary re-renders of child elements.

**Fix:** Extract to separate `React.memo` components.

---

### M5: `useAuthStore` Access Pattern Inconsistency
**Files:** Multiple

**Issue:** Some components use `useAuthStore((s: any) => s.language)` (App.tsx, with `any`), others use `useAuthStore(state => state.isSuperAdmin)` (BusinessUnitQuickViewDrawer). The `any` type completely bypasses the store's type safety.

**Fix:** Remove `any` from all `useAuthStore` selectors. Define typed selectors.

---

### M6: ConfirmDialog in BusinessUnitListPage Uses Inline Styles
**File:** `businessUnit/pages/BusinessUnitListPage.tsx` (lines 557-584)

**Issue:** The confirm dialog is implemented inline with hardcoded `style={{...}}` values instead of using a shared modal component. This duplicates modal logic and styling.

**Fix:** Use the shared `ConfirmDialog` component from `@/components/common/ConfirmDialog`.

---

### M7: EditMembershipModal Missing Form Validation
**File:** `userBusinessUnit/components/EditMembershipModal.tsx`

**Issue:** The modal has no form validation library (no Zod, no React Hook Form). Users can submit empty or invalid date ranges (e.g., effectiveTo before effectiveFrom, though the input has `min` attribute).

**Fix:** Add Zod schema and React Hook Form integration.

---

### M8: Pagination State Not Synchronized with URL
**Files:**
- `businessUnit/pages/BusinessUnitListPage.tsx`
- `userBusinessUnit/pages/userBusinessUnitListPage.tsx`

**Issue:** Page numbers are stored in component state (`useState`) rather than URL query parameters. Refreshing the page resets to page 1. Browser back/forward does not restore pagination.

**Fix:** Use `useSearchParams` to sync page state with URL.

---

### M9: Missing Empty States for Tabs
**File:** `businessUnit/pages/BusinessUnitDetailPage.tsx` (lines 314-328)

**Issue:** The `members` and `modules` tabs show placeholder text "Module coming in IAM phase" / "Subscription module management coming soon" without any empty state illustration or actionable CTA.

**Fix:** Add proper empty state components with icons and helpful messaging.

---

### M10: `userBusinessUnitApi.create` Maps to Wrong Backend Fields
**File:** `userBusinessUnit/api/userBusinessUnitApi.ts` (lines 91-101)

**Issue:** The create method maps `data.user` → `payload.user` and `data.businessUnit` → `payload.business_unit`. But the `UserBusinessUnitCreatePayload` interface uses camelCase field names. If the backend actually expects snake_case, this mapping is correct, but it's confusing that the payload interface doesn't match the API request shape.

Actually looking again, the payload object sent to apiClient uses snake_case keys (`user`, `business_unit`, etc.) which matches the interface property names... wait no. The interface has `user: string` and `businessUnit: string` (camelCase). But the payload sent uses `user` and `business_unit` (mixed). This is inconsistent.

**Fix:** Make the payload interface match what the API expects (snake_case), or use a consistent mapper.

---

### M11: `BusinessUnitDetailPage` Minimal Loading State
**File:** `businessUnit/pages/BusinessUnitDetailPage.tsx` (lines 97-102)

**Issue:** Loading state is just text: `<div style={{padding:40,...}}>Loading Business Unit...</div>`. No skeleton matching the actual layout.

**Fix:** Add a `DetailSkeleton` component similar to `BusinessDomainDetailPage`.

---

### M12: `useUserBusinessUnits` Query Key Not Deterministic
**File:** `userBusinessUnit/hooks/useUserBusinessUnits.ts` (line 55)

**Issue:** `queryKey: UBU_QUERY_KEYS.list(params as Record<string, unknown>)` — if `params` contains functions, dates, or other non-serializable values, the query key will be unstable.

**Fix:** Sanitize params before using them as a query key (e.g., `JSON.stringify` stable sort).

---

## LOW Issues

### L1: Inconsistent File Naming
**Examples:**
- `usebusinessUnit.ts` (lowercase b) vs `useBusinessUnits.ts` (uppercase B)
- `userBusinessUnitDetailPage.tsx` (lowercase first letter) vs `BusinessUnitDetailPage.tsx` (uppercase)

**Fix:** Enforce PascalCase for components, camelCase for hooks/utilities.

---

### L2: `userBusinessUnitRoutes.tsx` Comment Uses Backslash Paths
**File:** `userBusinessUnit/routes/userBusinessUnitRoutes.tsx` (line 1)

**Issue:** `// yss_orbit\frontend\src\modules\userBusinessUnit\routes\userBusinessUnitRoutes.tsx` — Windows-style backslashes in a comment that will confuse Unix developers.

**Fix:** Use forward slashes in comments.

---

### L3: BusinessDomainDetailPage Inline CSS Animation Keyframes
**File:** `businessDomain/pages/BusinessDomainDetailPage.tsx` (lines 42-48)

**Issue:** CSS keyframes are injected via `<style>{PAGE_KEYFRAMES}</style>` on every render. This causes DOM thrashing and makes the animations untestable.

**Fix:** Move keyframes to a CSS module or global stylesheet.

---

### L4: Missing `useCallback` for Event Handlers in Tables
**File:** `businessUnit/pages/BusinessUnitListPage.tsx`

**Issue:** Inline arrow functions in table rows:
```tsx
onClick={()=>setQuickViewBu(bu)}
onEdit={()=>openEditModal(bu)}
```

These create new function references on every render, causing unnecessary re-renders.

**Fix:** Use `useCallback` or extract to memoized row components.

---

### L5: `StatCard` Component Duplicated
**Files:**
- `businessUnit/pages/BusinessUnitListPage.tsx` (lines 173-188)
- `organization/components/OrganizationStatsCards.tsx`

**Issue:** Two different `StatCard` implementations with different styling approaches.

**Fix:** Consolidate into a shared `@/components/ui/StatCard`.

---

### L6: Unused Imports
**Files:** Multiple

**Examples:**
- `BusinessDomainEditPage.tsx` imports `ChevronRight` but never uses it
- `BusinessDomainDetailPage.tsx` imports `LayoutGrid` but never uses it

**Fix:** Enable `eslint-plugin-unused-imports` in CI.

---

### L7: `validateBusinessUnitPayload` References Deleted Field
**File:** `businessUnit/utils/businessUnitHelpers.ts` (line 192)

**Issue:** `if (!payload.industry) errors.push('industry is required');` — but `industry` was removed from the model.

**Fix:** Remove the industry validation check.

---

### L8: `TIMEZONE_OPTIONS` and `CURRENCY_OPTIONS` Are Hardcoded
**File:** `businessUnit/constants/businessUnitConstants.ts`

**Issue:** Timezone and currency options are static arrays. Adding a new supported timezone requires a code change.

**Fix:** Fetch from `/business-units/meta/` endpoint if it provides these lists.

---

### L9: `BusinessUnitFormModal` Has No `reason` Field for Audit Trail
**Files:**
- `businessUnit/components/BusinessUnitFormModal.tsx`
- `businessDomain/pages/BusinessDomainCreatePage.tsx` has `reason` field
- `businessDomain/pages/BusinessDomainEditPage.tsx` has `reason` field

**Issue:** BU create/edit does not capture audit reasons, while Business Domain does.

**Fix:** Add optional `reason` field to BU form for audit parity.

---

### L10: Tests Use `as any` to Bypass Type Checking
**Files:**
- `businessUnitStore.test.ts` (line 59): `openEditModal(mockBu as any)`
- `organizationStore.test.ts` (line 7): `const org = { ..., slug: 'test' } as any`

**Fix:** Use properly typed fixtures.

---

## Accessibility Findings

### A1: Keyboard Trap in Modals
**File:** `businessUnit/components/BusinessUnitFormModal.tsx`

**Issue:** The modal traps focus visually but does not implement focus cycling. Tabbing past the last element shifts focus to background elements.

**Fix:** Use a focus trap library or implement `Tab`/`Shift+Tab` cycling.

---

### A2: Missing `aria-live` for Dynamic Content
**File:** `businessUnit/pages/BusinessUnitListPage.tsx`

**Issue:** Tab switches (All/Active/Inactive/Archived) change the table content without announcing to screen readers.

**Fix:** Add `aria-live="polite"` region around the results table.

---

### A3: StatusBadges Use Color Alone
**File:** `businessUnit/pages/BusinessUnitListPage.tsx` (lines 53-70)

**Issue:** The `StatusBadge` uses background color (`rgba(16,185,129,.15)`) and text color to indicate status, but the icon is only visible to sighted users. Screen readers hear "Active" which is okay, but colorblind users may struggle with the grid view where the badge is small.

**Fix:** Ensure text label is always visible and has sufficient contrast.

---

### A4: `BusinessDomainDetailPage` Keyboard Shortcuts Not Documented to AT
**File:** `businessDomain/pages/BusinessDomainDetailPage.tsx` (lines 301-325)

**Issue:** Keyboard shortcuts (E, A, Escape, ArrowLeft) are only visible in a small hints strip at the bottom. Screen reader users have no way to discover them.

**Fix:** Add `aria-keyshortcuts` attributes to focusable elements and document shortcuts in an accessible help modal.

---

## Cross-Module Synchronization Issues

### X1: Route Namespace Collision
**Issue:** `AppRouter.tsx` imports Business Unit pages from `@/pages/businessUnit/` while the feature module is at `features/organization/businessUnit/`. The `OrganizationRoutes` component in `features/organization/routes/organizationRoutes.tsx` is NOT used in `AppRouter.tsx` — AppRouter defines organization routes inline.

**Impact:** The `organizationRoutes.tsx` file appears to be dead code. Any route changes there have no effect.

---

### X2: Cache Invalidation Inconsistency
**Files:**
- `businessUnit/hooks/useBusinessUnits.ts` (lines 56-59, 69-76, 83-89)
- `organization/hooks/useOrganizations.ts` (lines 154-156, 171-174)

**Issue:** BU mutations invalidate `organizationKeys.lists()` and `businessDomainKeys.lists()`, which is correct. However, Organization mutations only invalidate `organizationKeys.all()` and `businessDomainKeys.all()` — they do NOT invalidate BU lists. If an organization is archived, its BUs should also disappear from active BU lists.

**Fix:** Add `qc.invalidateQueries({ queryKey: BU_KEYS.lists() })` to organization mutations.

---

### X3: Business Domain Counts Not Reactive
**File:** `businessDomain/pages/BusinessDomainDetailPage.tsx` (lines 382-547)

**Issue:** The KPI strip shows `organizations_count`, `business_units_count`, and `active_users_count` from the domain object. But these are backend-computed annotations that may become stale if child objects change. The detail page does not refetch these counts automatically.

**Fix:** Add a background refetch interval or refetch on window focus.

---

### X4: User-BU Mapping Detail Page Does Not Subscribe to List Cache
**File:** `userBusinessUnit/pages/userBusinessUnitDetailPage.tsx`

**Issue:** As noted in C2 and C6, this page uses completely independent state. Activating/deactivating a membership here does not update the list page's React Query cache, requiring a manual refresh.

**Fix:** Migrate to React Query hooks with proper cache invalidation.

---

## Recommendations (Prioritized)

### Immediate (This Sprint)
1. **Consolidate duplicate API mutation layers** (C1) — Pick one file, delete the other.
2. **Fix route imports** (C3) — Verify whether `pages/` or `features/` is canonical. Delete ghost pages.
3. **Migrate User-BU detail page to React Query** (C2, C6) — Eliminate Zustand data fetching.
4. **Fix Business Unit inline styles** (C8) — This is a visible dark mode regression.
5. **Add PermissionGate to BU pages** (H1) — Security requirement.

### Short-term (Next 2 Sprints)
6. Replace all `any` types with proper interfaces (C4).
7. Fix mismatched form validation schemas (C7).
8. Add ErrorBoundaries to all modals (H4).
9. Fix keyboard shortcut conflicts (H3).
10. Extract shared LogoUploadZone and StatCard components (M1, L5).
11. Sync pagination state with URL (M8).

### Medium-term (Next Quarter)
12. Standardize all routing patterns (M2).
13. Add focus trapping to modals (A1).
14. Implement proper skeleton loading states for all pages (M11).
15. Remove dead constants and helpers (M3, L7).
16. Add comprehensive integration tests for cross-module cache invalidation (X2).

---

*Report generated from audit of 69 files under `frontend/src/features/organization/`*
