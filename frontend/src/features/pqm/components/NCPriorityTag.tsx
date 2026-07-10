// yss_orbit\frontend\src\features\pqm\components\NCPriorityTag.tsx
import React from 'react';
import { Flame, AlertTriangle, Minus, ArrowDown } from 'lucide-react';
import { Priority } from '../types';

interface PriorityConfig {
  color: string;
  bg: string;
  border: string;
  icon: React.ReactNode;
}

const PRIORITY_CONFIG: Record<string, PriorityConfig> = {
  Critical: {
    color: '#DC2626',
    bg: '#FEF2F2',
    border: '#FCA5A5',
    icon: <Flame size={11} />,
  },
  High: {
    color: '#EA580C',
    bg: '#FFF7ED',
    border: '#FED7AA',
    icon: <AlertTriangle size={11} />,
  },
  Medium: {
    color: '#B45309',
    bg: '#FFFBEB',
    border: '#FDE68A',
    icon: <Minus size={11} />,
  },
  Low: {
    color: '#475569',
    bg: '#F1F5F9',
    border: '#CBD5E1',
    icon: <ArrowDown size={11} />,
  },
};

interface NCPriorityTagProps {
  priority: Priority;
  size?: 'sm' | 'md';
}

export function NCPriorityTag({ priority, size = 'md' }: NCPriorityTagProps) {
  const cfg = PRIORITY_CONFIG[priority] ?? PRIORITY_CONFIG['Low'];
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        padding: size === 'sm' ? '2px 6px' : '3px 8px',
        borderRadius: '6px',
        fontSize: size === 'sm' ? '10px' : '11px',
        fontWeight: 700,
        color: cfg.color,
        background: cfg.bg,
        border: `1px solid ${cfg.border}`,
        whiteSpace: 'nowrap',
        letterSpacing: '0.02em',
      }}
      role="img"
      aria-label={`Priority: ${priority}`}
    >
      {cfg.icon}
      {priority}
    </span>
  );
}
