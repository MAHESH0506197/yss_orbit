// yss_orbit/frontend/src/modules/organization/constants/organizationConstants.ts
// Synchronized with backend ALLOWED_ORDERINGS in OrganizationViewSet.

export const ORG_PAGE_SIZE_OPTIONS = [10, 20, 50, 100] as const;
export const ORG_DEFAULT_PAGE_SIZE = 20;

// ─── Ordering ─────────────────────────────────────────────────────────────────
// Must exactly match ALLOWED_ORDERINGS in organization_view.py:
// { "name", "-name", "created_at", "-created_at", "is_active", "-is_active" }
export const ORG_ORDERING_OPTIONS = [
  { value: 'name',         label: 'Name (A → Z)' },
  { value: '-name',        label: 'Name (Z → A)' },
  { value: '-created_at',  label: 'Newest First' },
  { value: 'created_at',   label: 'Oldest First' },
  { value: '-is_active',   label: 'Active First' },
  { value: 'is_active',    label: 'Inactive First' },
] as const;

// ─── Status Filter ────────────────────────────────────────────────────────────
export const ORG_STATUS_FILTER_OPTIONS = [
  { value: 'all',      label: 'All' },
  { value: 'active',   label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'deleted',  label: 'Archived' },
] as const;

// ─── Timezone options ─────────────────────────────────────────────────────────
// Synchronized with backend enums/enums.py TIMEZONE_CHOICES
export const TIMEZONE_OPTIONS = [
  { value: 'Asia/Kolkata',        label: 'Asia/Kolkata (IST)' },
  { value: 'Asia/Dubai',          label: 'Asia/Dubai (GST)' },
  { value: 'Asia/Singapore',      label: 'Asia/Singapore (SGT)' },
  { value: 'Asia/Tokyo',          label: 'Asia/Tokyo (JST)' },
  { value: 'Europe/London',       label: 'Europe/London (GMT/BST)' },
  { value: 'Europe/Paris',        label: 'Europe/Paris (CET)' },
  { value: 'Europe/Berlin',       label: 'Europe/Berlin (CET)' },
  { value: 'America/New_York',    label: 'America/New_York (EST)' },
  { value: 'America/Chicago',     label: 'America/Chicago (CST)' },
  { value: 'America/Los_Angeles', label: 'America/Los_Angeles (PST)' },
  { value: 'Australia/Sydney',    label: 'Australia/Sydney (AEST)' },
  { value: 'Pacific/Auckland',    label: 'Pacific/Auckland (NZST)' },
  { value: 'UTC',                 label: 'UTC' },
] as const;

// ─── Date format options ──────────────────────────────────────────────────────
// Synchronized with backend enums/enums.py DateFormatChoices
export const DATE_FORMAT_OPTIONS = [
  { value: 'DD/MM/YYYY',  label: 'DD/MM/YYYY (India)' },
  { value: 'MM/DD/YYYY',  label: 'MM/DD/YYYY (US)' },
  { value: 'YYYY-MM-DD',  label: 'YYYY-MM-DD (ISO)' },
  { value: 'DD MMM YYYY', label: 'DD MMM YYYY (Long)' },
] as const;

// ─── Currency options ─────────────────────────────────────────────────────────
// Synchronized with backend enums/enums.py CurrencyChoices
export const CURRENCY_OPTIONS = [
  { value: 'INR', label: 'Indian Rupee',      symbol: '₹' },
  { value: 'USD', label: 'US Dollar',         symbol: '$' },
  { value: 'EUR', label: 'Euro',              symbol: '€' },
  { value: 'GBP', label: 'British Pound',     symbol: '£' },
  { value: 'AED', label: 'UAE Dirham',        symbol: 'د.إ' },
  { value: 'SGD', label: 'Singapore Dollar',  symbol: 'S$' },
] as const;

// ─── Validation regex ─────────────────────────────────────────────────────────
/** Slug: lowercase letters, numbers, hyphens. Must match backend validate_org_slug */
export const SLUG_REGEX = /^[a-z0-9-]+$/;

/** GST: 15-char format e.g. 22AAAAA0000A1Z5 */
export const GST_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

/** PAN: 10-char format e.g. ABCDE1234F */
export const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
