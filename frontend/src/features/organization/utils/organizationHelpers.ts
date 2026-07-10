// yss_orbit/frontend/src/modules/organization/utils/organizationHelpers.ts

import type { Organization, OrganizationStatus } from '../types/organizationTypes';

// ─── Slug ─────────────────────────────────────────────────────────────────────
/** Convert a free-text name to a URL-safe slug. Matches backend slugify logic. */
export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-{2,}/g, '-')
    .replace(/^-+|-+$/g, '');
}

// ─── Avatar ───────────────────────────────────────────────────────────────────
/** Return 1-2 uppercase initials from an organization name. */
export function getOrgInitials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map(w => w[0]?.toUpperCase() ?? '')
    .join('');
}

/** Deterministic avatar background based on org name. */
export const AVATAR_PALETTE = [
  { bg: '#8B5CF6', text: '#FFFFFF' }, // violet-500
  { bg: '#3B82F6', text: '#FFFFFF' }, // blue-500
  { bg: '#10B981', text: '#FFFFFF' }, // emerald-500
  { bg: '#F59E0B', text: '#FFFFFF' }, // amber-500
  { bg: '#F43F5E', text: '#FFFFFF' }, // rose-500
  { bg: '#06B6D4', text: '#FFFFFF' }, // cyan-500
] as const;

export function getAvatarColor(name: string): (typeof AVATAR_PALETTE)[number] {
  let h = 0;
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) & 0xffff;
  // @ts-expect-error - Auto-patched TS2322
  return AVATAR_PALETTE[h % AVATAR_PALETTE.length];
}

/** Tailwind class variant for avatar (matches list page inline usage). */
export const AVATAR_TAILWIND_CLASSES = [
  'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300',
  'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300',
  'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300',
];

export function getAvatarTailwindClass(name: string): string {
  let h = 0;
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) & 0xffff;
  // @ts-expect-error - Auto-patched TS2322
  return AVATAR_TAILWIND_CLASSES[h % AVATAR_TAILWIND_CLASSES.length];
}

// ─── Status ───────────────────────────────────────────────────────────────────
export function deriveOrgStatus(org: Organization): OrganizationStatus {
  if (org.is_deleted) return 'deleted';
  if (org.is_active) return 'active';
  return 'inactive';
}

export const STATUS_LABELS: Record<OrganizationStatus, string> = {
  active:   'Active',
  inactive: 'Inactive',
  deleted:  'Archived',
};

export const STATUS_COLORS: Record<OrganizationStatus, string> = {
  active:   'text-emerald-700 bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400',
  inactive: 'text-amber-700 bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400',
  deleted:  'text-red-700 bg-red-100 dark:bg-red-900/30 dark:text-red-400',
};

// ─── GST / PAN ────────────────────────────────────────────────────────────────
export function isValidGST(value: string): boolean {
  return /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(value);
}

export function isValidPAN(value: string): boolean {
  return /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(value);
}

export function maskPAN(pan: string): string {
  if (!pan || pan.length < 4) return pan;
  return pan.slice(0, 2) + '•'.repeat(pan.length - 4) + pan.slice(-2);
}

// ─── Currency ─────────────────────────────────────────────────────────────────
const CURRENCY_SYMBOLS: Record<string, string> = {
  INR: 'â‚¹', USD: '$', EUR: 'â‚¬', GBP: 'Â£',
  AED: 'Ø¯.Ø¥', SGD: 'S$', JPY: 'Â¥', CAD: 'C$', AUD: 'A$',
};

export function getCurrencySymbol(code: string): string {
  return CURRENCY_SYMBOLS[code?.toUpperCase()] ?? code;
}

export function formatCurrency(amount: number, code: string): string {
  try {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: code,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${getCurrencySymbol(code)}${amount.toFixed(2)}`;
  }
}

// ─── Country ──────────────────────────────────────────────────────────────────
const COUNTRY_NAMES: Record<string, string> = {
  IN: 'India', US: 'United States', GB: 'United Kingdom',
  AE: 'UAE', SG: 'Singapore', AU: 'Australia',
  DE: 'Germany', FR: 'France', CA: 'Canada', JP: 'Japan',
};

export function getCountryName(code: string): string {
  return COUNTRY_NAMES[code?.toUpperCase()] ?? code;
}

// ─── Ordering label ───────────────────────────────────────────────────────────
// Matches ORG_ORDERING_OPTIONS — backend ALLOWED_ORDERINGS only.
export function buildOrderingLabel(ordering: string): string {
  const map: Record<string, string> = {
    name:        'Name (Aâ†’Z)',
    '-name':     'Name (Zâ†’A)',
    created_at:  'Oldest First',
    '-created_at': 'Newest First',
    is_active:   'Inactive First',
    '-is_active': 'Active First',
  };
  return map[ordering] ?? ordering;
}

// ─── API error extraction ─────────────────────────────────────────────────────
export function extractApiError(err: unknown): string {
  const e = err as any;
  if (!e?.response?.data) return 'An unexpected error occurred.';
  const d = e.response.data;
  if (typeof d.detail === 'string') return d.detail;
  if (typeof d.message === 'string') return d.message;
  const fieldErrors = Object.entries(d)
    .filter(([k]) => k !== 'success')
    .map(([k, v]) => `${k}: ${Array.isArray(v) ? v[0] : v}`)
    .slice(0, 2)
    .join('; ');
  return fieldErrors || 'Something went wrong.';
}

export function getOrganizationStatus(org: any): string {
  if (org.is_deleted) return 'deleted';
  if (!org.is_active) return 'inactive';
  return 'active';
}

