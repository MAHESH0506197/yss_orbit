// yss_orbit\frontend\src\core\accessibility\ariaHelpers.ts
// ARIA attribute helpers
export const ariaLabel = (label: string) => ({ 'aria-label': label });
export const ariaLive = (v: 'polite' | 'assertive' = 'polite') => ({ 'aria-live': v });

