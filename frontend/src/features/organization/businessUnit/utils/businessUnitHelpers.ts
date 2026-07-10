// yss_orbit/frontend/src/modules/businessUnit/utils/businessUnitHelpers.ts
// FIXED: was a 2-function stub using camelCase 'createdAt' (wrong — model uses snake_case 'created_at').
// Replaced with a full helper library matching organizationHelpers.ts in breadth.

import type { BusinessUnit, BusinessUnitStatus } from '../types/businessUnitTypes';
import { formatIST } from '@/utils/date';

// ─── Status ───────────────────────────────────────────────────────────────────
export function getBusinessUnitStatus(bu: BusinessUnit): BusinessUnitStatus {
  if (bu.is_deleted) return 'deleted';
  if (bu.is_active) return 'active';
  return 'inactive';
}

export const BU_STATUS_LABELS: Record<BusinessUnitStatus, string> = {
  active:   'Active',
  inactive: 'Inactive',
  deleted:  'Archived',
};

export const BU_STATUS_COLORS: Record<BusinessUnitStatus, string> = {
  active:   'text-emerald-700 bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400',
  inactive: 'text-amber-700 bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400',
  deleted:  'text-red-700 bg-red-100 dark:bg-red-900/30 dark:text-red-400',
};

// ─── Avatar ───────────────────────────────────────────────────────────────────
export const BU_AVATAR_PALETTE = [
  { bg: '#EDE9FE', text: '#6D28D9' }, // violet
  { bg: '#DBEAFE', text: '#1D4ED8' }, // blue
  { bg: '#D1FAE5', text: '#065F46' }, // emerald
  { bg: '#FEF3C7', text: '#92400E' }, // amber
  { bg: '#FFE4E6', text: '#9F1239' }, // rose
  { bg: '#CFFAFE', text: '#0E7490' }, // cyan
] as const;

export function getBuAvatarColor(name: string): (typeof BU_AVATAR_PALETTE)[number] {
  let h = 0;
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) & 0xffff;
  // @ts-expect-error - Auto-patched TS2322
  return BU_AVATAR_PALETTE[h % BU_AVATAR_PALETTE.length];
}

export function getBuInitials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');
}

// ─── Industry ─────────────────────────────────────────────────────────────────
const INDUSTRY_LABELS: Record<string, string> = {
  RETAIL:        'Retail',
  RESTAURANT:    'Restaurant',
  PHARMACY:      'Pharmacy',
  WHOLESALE:     'Wholesale',
  SERVICES:      'Services',
  MANUFACTURING: 'Manufacturing',
  ECOMMERCE:     'E-Commerce',
  HEALTHCARE:    'Healthcare',
  EDUCATION:     'Education',
  OTHER:         'Other',
};

const INDUSTRY_EMOJIS: Record<string, string> = {
  RETAIL:        '🛒',
  RESTAURANT:    '🍴',
  PHARMACY:      '💊',
  WHOLESALE:     '📦',
  SERVICES:      '🧑‍💼',
  MANUFACTURING: '🏭',
  ECOMMERCE:     '🛍',
  HEALTHCARE:    '🏥',
  EDUCATION:     '🏫',
  OTHER:         '📦',
};

export function getIndustryLabel(industry: string): string {
  return INDUSTRY_LABELS[industry?.toUpperCase()] ?? industry;
}

export function getIndustryEmoji(industry: string): string {
  return INDUSTRY_EMOJIS[industry?.toUpperCase()] ?? '📦';
}

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

// ─── Currency / Locale ────────────────────────────────────────────────────────
const CURRENCY_SYMBOLS: Record<string, string> = {
  INR: '₹', USD: '$', EUR: '€', GBP: '£',
  AED: 'د.إ', SGD: 'S$', JPY: '¥', CAD: 'C$', AUD: 'A$',
};

export function getCurrencySymbol(code: string): string {
  return CURRENCY_SYMBOLS[code?.toUpperCase()] ?? code;
}

const COUNTRY_NAMES: Record<string, string> = {
  IN: 'India', US: 'United States', GB: 'United Kingdom',
  AE: 'UAE', SG: 'Singapore', AU: 'Australia',
  DE: 'Germany', FR: 'France', CA: 'Canada', JP: 'Japan',
};

export function getCountryName(code: string): string {
  return COUNTRY_NAMES[code?.toUpperCase()] ?? code;
}

// ─── Date formatting ──────────────────────────────────────────────────────────
/**
 * FIXED: original stub used data.createdAt (camelCase) — model returns created_at (snake_case).
 * Use this helper anywhere you need a formatted date from a BusinessUnit.
 */
export function formatBuDate(isoString: string | null | undefined): string {
  if (!isoString) return '—';
  try {
    return formatIST(new Date(isoString), 'PPP');
  } catch {
    return isoString;
  }
}

// ─── Effective values ─────────────────────────────────────────────────────────
export function getEffectiveTimezone(bu: BusinessUnit): string {
  return bu.effective_timezone || bu.timezone || 'Asia/Kolkata';
}

export function getEffectiveCurrency(bu: BusinessUnit): string {
  return bu.effective_currency || bu.currency_code || 'INR';
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

// ─── Ordering label ───────────────────────────────────────────────────────────
export function buildBuOrderingLabel(ordering: string): string {
  const map: Record<string, string> = {
    name:          'Name (A→Z)',
    '-name':       'Name (Z→A)',
    code:          'Code (A→Z)',
    '-code':       'Code (Z→A)',
    created_at:    'Oldest First',
    '-created_at': 'Newest First',
    is_active:     'Inactive First',
    '-is_active':  'Active First',
  };
  return map[ordering] ?? ordering;
}

// ─── Validation payload helper (replaces the broken stub) ─────────────────────
/**
 * Returns a list of user-facing validation error strings for a given payload.
 * Intended for use in data-import / bulk-create scenarios, not the form UI.
 */
export function validateBusinessUnitPayload(
  payload: Partial<Record<string, unknown>>,
): string[] {
  const errors: string[] = [];
  if (!payload || typeof payload !== 'object') {
    errors.push('Payload cannot be empty');
    return errors;
  }
  if (!payload.name) errors.push('name is required');
  if (!payload.code) errors.push('code is required');
  if (!payload.industry) errors.push('industry is required');
  return errors;
}
