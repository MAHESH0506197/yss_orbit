// yss_orbit/frontend/src/modules/organization/tests/organizationHelpers.test.ts
import { describe, it, expect } from 'vitest';
import {
  generateSlug, getOrgInitials, isValidGST, isValidPAN,
  maskPAN, getCurrencySymbol, deriveOrgStatus,
} from '../utils/organizationHelpers';
import type { Organization } from '../types/organizationTypes';

describe('generateSlug', () => {
  it('converts spaces to hyphens', () => expect(generateSlug('Acme Corp')).toBe('acme-corp'));
  it('lowercases input', () => expect(generateSlug('UPPER CASE')).toBe('upper-case'));
  it('strips special chars', () => expect(generateSlug('Hello & World!')). toBe('hello-world'));
  it('collapses multiple hyphens', () => expect(generateSlug('a  b')).toBe('a-b'));
});

describe('getOrgInitials', () => {
  it('returns 2 initials for two-word name', () => expect(getOrgInitials('Acme Corp')).toBe('AC'));
  it('returns 1 initial for single word', () => expect(getOrgInitials('Google')).toBe('G'));
});

describe('isValidGST', () => {
  it('accepts valid GST', () => expect(isValidGST('22AAAAA0000A1Z5')).toBe(true));
  it('rejects invalid GST', () => expect(isValidGST('INVALID')).toBe(false));
  it('rejects empty', () => expect(isValidGST('')). toBe(false));
});

describe('isValidPAN', () => {
  it('accepts valid PAN', () => expect(isValidPAN('ABCDE1234F')).toBe(true));
  it('rejects lowercase', () => expect(isValidPAN('abcde1234f')).toBe(false));
  it('rejects too short', () => expect(isValidPAN('ABC1234')).toBe(false));
});

describe('maskPAN', () => {
  it('masks middle chars', () => {
    const masked = maskPAN('ABCDE1234F');
    expect(masked.startsWith('AB')).toBe(true);
    expect(masked.endsWith('4F')).toBe(true);
    expect(masked).not.toContain('CDE123');
  });
});

describe('getCurrencySymbol', () => {
  it('returns ₹ for INR', () => expect(getCurrencySymbol('INR')).toBe('₹'));
  it('returns $ for USD', () => expect(getCurrencySymbol('USD')).toBe('$'));
  it('returns code for unknown', () => expect(getCurrencySymbol('XYZ')).toBe('XYZ'));
});

describe('deriveOrgStatus', () => {
  const base = { is_deleted: false, is_active: true } as Organization;
  it('returns active', () => expect(deriveOrgStatus(base)).toBe('active'));
  it('returns inactive', () => expect(deriveOrgStatus({ ...base, is_active: false })).toBe('inactive'));
  it('returns deleted', () => expect(deriveOrgStatus({ ...base, is_deleted: true })).toBe('deleted'));
});
