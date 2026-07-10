// yss_orbit\frontend\src\utils\index.ts
// Token Management Constants
const TOKEN_KEY = 'orbit_auth_token';

/**
 * Retrieves the authentication token from local storage.
 */
export const getAuthToken = (): string | null => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem(TOKEN_KEY);
  }
  return null;
};

/**
 * Stores the authentication token in local storage.
 */
export const setAuthToken = (token: string): void => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(TOKEN_KEY, token);
  }
};

/**
 * Removes the authentication token from local storage.
 */
export const removeAuthToken = (): void => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(TOKEN_KEY);
  }
};

/**
 * Parses an API error into a user-friendly string message.
 */
export const parseApiError = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return 'An unexpected error occurred.';
};

/**
 * A utility to check if we are currently running in a browser environment.
 */
export const isBrowser = (): boolean => typeof window !== 'undefined';
