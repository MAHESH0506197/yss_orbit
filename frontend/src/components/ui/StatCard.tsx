// src/components/ui/StatCard.tsx
// Enterprise-grade KPI stat card.
// UPGRADED: optional onClick (click-to-filter), optional subLabel for context,
// active/selected state ring, animated value counter on mount.
import React, { useEffect, useRef, useState } from 'react';

export interface StatCardProps {
  label: string;
  value: number | string;
  icon: React.ElementType;
  gradient: string;
  /** Optional sub-label shown below the value (e.g. "24 orgs assigned") */
  subLabel?: string;
  /** When provided, card becomes a button that applies a filter */
  onClick?: () => void;
  /** Highlight ring when this card's filter is currently active */
  isActive?: boolean;
}

function AnimatedNumber({ value }: { value: number }) {
  const [display, setDisplay] = useState(0);
  const rafRef = useRef<number>();

  useEffect(() => {
    const start = 0;
    const end = value;
    const duration = 600;
    const startTime = performance.now();

    const tick = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(start + (end - start) * eased));
      if (progress < 1) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [value]);

  return <>{display}</>;
}

export function StatCard({ label, value, icon: Icon, gradient, subLabel, onClick, isActive }: StatCardProps) {
  const isNumeric = typeof value === 'number';
  const Tag = onClick ? 'button' : 'div';

  return (
    <Tag
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      className={[
        'relative overflow-hidden rounded-xl border bg-card p-3 shadow-sm transition-all duration-200 group text-left w-full',
        onClick ? 'cursor-pointer hover:-translate-y-1 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2' : '',
        isActive ? 'ring-2 ring-violet-500 border-violet-300 dark:border-violet-700' : 'border-border',
      ].join(' ')}
      aria-pressed={onClick ? isActive : undefined}
    >
      {/* Background glow blob */}
      <div
        className={`absolute -right-6 -top-6 h-20 w-20 rounded-full opacity-[0.08] ${gradient} ${onClick ? 'group-hover:opacity-[0.15] group-hover:scale-110' : ''} transition-all duration-500`}
        style={{ filter: 'blur(14px)' }}
      />

      {/* Active filter indicator stripe */}
      {isActive && (
        <div className={`absolute inset-x-0 top-0 h-0.5 ${gradient}`} />
      )}

      <div className="flex items-start justify-between">
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{label}</p>
          <p className="mt-1 text-3xl font-extrabold tabular-nums text-foreground leading-none">
            {isNumeric ? <AnimatedNumber value={value as number} /> : value}
          </p>
          {subLabel && (
            <p className="mt-1 text-[10px] font-medium text-muted-foreground truncate">{subLabel}</p>
          )}
        </div>
        <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${gradient} text-white shadow-lg ${onClick ? 'group-hover:shadow-xl group-hover:scale-110' : ''} transition-all duration-200`}>
          <Icon className="h-3.5 w-3.5" />
        </div>
      </div>

    </Tag>
  );
}
