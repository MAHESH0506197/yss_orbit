// yss_orbit/frontend/src/modules/businessUnit/constants/businessUnitConstants.ts
// Synchronized with backend BusinessUnit model choices.

export const BU_PAGE_SIZE_OPTIONS = [10, 20, 50, 100] as const;
export const BU_DEFAULT_PAGE_SIZE = 20;

// ─── Ordering ─────────────────────────────────────────────────────────────────
export const BU_ORDERING_OPTIONS = [
  { value: 'name',        label: 'Name (A → Z)' },
  { value: '-name',       label: 'Name (Z → A)' },
  { value: '-created_at', label: 'Newest First' },
  { value: 'created_at',  label: 'Oldest First' },
  { value: '-is_active',  label: 'Active First' },
  { value: 'is_active',   label: 'Inactive First' },
] as const;

// ─── Status Filter ────────────────────────────────────────────────────────────
export const BU_STATUS_FILTER_OPTIONS = [
  { value: 'all',      label: 'All' },
  { value: 'active',   label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'deleted',  label: 'Archived' },
] as const;

// ─── Industry Options (matches backend BusinessUnitIndustry choices) ───────────
export const BU_INDUSTRY_OPTIONS = [
  { value: 'RETAIL',        label: 'Retail',        emoji: '🛒' },
  { value: 'RESTAURANT',    label: 'Restaurant',    emoji: '🍴' },
  { value: 'PHARMACY',      label: 'Pharmacy',      emoji: '💊' },
  { value: 'WHOLESALE',     label: 'Wholesale',     emoji: '📦' },
  { value: 'SERVICES',      label: 'Services',      emoji: '🧑‍💼' },
  { value: 'MANUFACTURING', label: 'Manufacturing', emoji: '🏭' },
  { value: 'ECOMMERCE',     label: 'E-Commerce',    emoji: '🛍' },
  { value: 'HEALTHCARE',    label: 'Healthcare',    emoji: '🏥' },
  { value: 'EDUCATION',     label: 'Education',     emoji: '🏫' },
  { value: 'OTHER',         label: 'Other',         emoji: '📦' },
] as const;

// ─── Country Options ──────────────────────────────────────────────────────────
export const COUNTRY_OPTIONS = [
  { value: 'IN', label: 'India' },
  { value: 'US', label: 'United States' },
  { value: 'GB', label: 'United Kingdom' },
  { value: 'AE', label: 'UAE' },
  { value: 'SG', label: 'Singapore' },
  { value: 'AU', label: 'Australia' },
  { value: 'CA', label: 'Canada' },
  { value: 'DE', label: 'Germany' },
  { value: 'FR', label: 'France' },
  { value: 'JP', label: 'Japan' },
] as const;

// ─── Timezone Options ─────────────────────────────────────────────────────────
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
  { value: 'UTC',                 label: 'UTC' },
] as const;

// ─── Currency Options ─────────────────────────────────────────────────────────
export const CURRENCY_OPTIONS = [
  { value: 'INR', label: 'Indian Rupee',     symbol: '₹' },
  { value: 'USD', label: 'US Dollar',        symbol: '$' },
  { value: 'EUR', label: 'Euro',             symbol: '€' },
  { value: 'GBP', label: 'British Pound',    symbol: '£' },
  { value: 'AED', label: 'UAE Dirham',       symbol: 'د.إ' },
  { value: 'SGD', label: 'Singapore Dollar', symbol: 'S$' },
] as const;

// ─── Validation Regex (mirrors backend exactly) ────────────────────────────────
export const GST_REGEX   = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
export const PAN_REGEX   = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
export const HEX_REGEX   = /^#[0-9A-Fa-f]{6}$/;
export const PHONE_REGEX = /^[+]?[0-9 \-(). ]{7,20}$/;
export const CODE_REGEX  = /^[A-Z0-9_-]{2,20}$/;
