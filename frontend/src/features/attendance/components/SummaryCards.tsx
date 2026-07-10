// yss_orbit\frontend\src\features\attendance\components\SummaryCards.tsx
import React from 'react';
import { AttendanceSummary } from '../types';

interface SummaryCardsProps {
  summary: AttendanceSummary;
  isLoading: boolean;
}

export const SummaryCards: React.FC<SummaryCardsProps> = ({ summary, isLoading }) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="bg-[var(--color-surface)] p-6 rounded-lg shadow-sm border border-[var(--color-border)] animate-pulse">
            <div className="h-4 bg-[var(--color-surface-hover)] rounded w-1/2 mb-4"></div>
            <div className="h-8 bg-[var(--color-surface-hover)] rounded w-1/3"></div>
          </div>
        ))}
      </div>
    );
  }

  const cards = [
    { label: 'Total Employees', value: summary.total, color: 'text-[var(--color-info,rgb(59,130,246))]', bg: 'bg-[var(--color-info-bg,rgba(59,130,246,0.1))]' },
    { label: 'Present', value: summary.present, color: 'text-[var(--color-success,rgb(34,197,94))]', bg: 'bg-[var(--color-success-bg,rgba(34,197,94,0.1))]' },
    { label: 'Absent', value: summary.absent, color: 'text-[var(--color-danger,rgb(239,68,68))]', bg: 'bg-[var(--color-danger-bg,rgba(239,68,68,0.1))]' },
    { label: 'On Leave', value: summary.onLeave, color: 'text-[var(--color-warning,rgb(234,179,8))]', bg: 'bg-[var(--color-warning-bg,rgba(234,179,8,0.1))]' },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, i) => (
        <div key={i} className="bg-[var(--color-surface)] p-6 rounded-lg shadow-sm border border-[var(--color-border)] flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-[var(--color-text-muted)] mb-1">{card.label}</p>
            <h3 className={`text-2xl font-bold text-[var(--color-text)]`}>{card.value}</h3>
          </div>
          <div className={`w-12 h-12 rounded-full flex items-center justify-center ${card.bg} ${card.color}`}>
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          </div>
        </div>
      ))}
    </div>
  );
};
