// src/components/ui/RefetchBar.tsx
// ─────────────────────────────────────────────────────────────────────────────
// Enterprise Refetch Loading Bar — v1.0
// A thin animated progress bar that appears at the top of a data panel when
// background data is being refreshed (isFetching = true, isLoading = false).
// Inspired by Linear, GitHub, and Stripe dashboard patterns.
// ─────────────────────────────────────────────────────────────────────────────
import React from 'react';

interface RefetchBarProps {
  /** Show the bar when true (typically: isFetching && !isLoading) */
  visible: boolean;
  /** Additional CSS class on the container */
  className?: string;
}

export function RefetchBar({ visible, className = '' }: RefetchBarProps) {
  if (!visible) return null;

  return (
    <div
      role="progressbar"
      aria-label="Loading updated data"
      aria-busy="true"
      className={`relative h-0.5 w-full overflow-hidden bg-transparent ${className}`}
    >
      {/* Animated progress shimmer */}
      <div
        className="absolute inset-y-0 left-0 w-full bg-gradient-to-r from-violet-500 via-fuchsia-500 to-violet-500 animate-[refetchProgress_1.4s_ease-in-out_infinite]"
        style={{ backgroundSize: '200% 100%' }}
      />
    </div>
  );
}

export default RefetchBar;
