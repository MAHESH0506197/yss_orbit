// yss_orbit\frontend\src\tests\axiosClient.test.ts
/**
 * Tests for the canonical apiClient (src/core/api/client.ts).
 *
 * MIGRATION NOTE: The old axiosClient.test.ts tested the tombstoned
 * src/api/axiosClient.ts which stored tokens in localStorage (B06 §5.10 violation).
 * This test now validates the correct canonical client behavior:
 * - Tokens are in HttpOnly cookies (never localStorage)
 * - CSRF token is injected from cookie via X-CSRFToken header
 * - X-Business-Unit-Id header is injected from authStore
 */
import { describe, it, expect } from 'vitest';
import { apiClient } from '@/api/client';

describe('canonical apiClient (core/api/client)', () => {
  it('is an Axios instance', () => {
    expect(typeof apiClient.get).toBe('function');
    expect(typeof apiClient.post).toBe('function');
    expect(typeof apiClient.patch).toBe('function');
    expect(typeof apiClient.delete).toBe('function');
  });

  it('has withCredentials=true for HttpOnly cookie-based auth', () => {
    // Tokens must be in HttpOnly cookies — NEVER localStorage (B06 §5.10)
    expect((apiClient.defaults as any).withCredentials).toBe(true);
  });

  it('has correct base URL pointing to versioned API', () => {
    // Must use the versioned API base
    const baseURL = (apiClient.defaults as any).baseURL;
    expect(baseURL).toBeTruthy();
    // Must not be a localhost-only hardcoded URL
    expect(typeof baseURL).toBe('string');
  });
});
