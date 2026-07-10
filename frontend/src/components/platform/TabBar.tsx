// src/components/platform/TabBar.tsx
// ─────────────────────────────────────────────────────────────────────────────
// Standardized tab navigation for detail pages.
// Replaces the inline tab bars duplicated in BD, Org, BU detail pages.
// ─────────────────────────────────────────────────────────────────────────────
import React from 'react';

export interface TabItem {
  /** Unique tab identifier */
  id: string;
  /** Display label */
  label: string;
  /** Optional Lucide icon component */
  icon?: React.ElementType;
  /** Optional count badge displayed next to label */
  count?: number;
}

export interface TabBarProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (tabId: string) => void;
  /** Extra Tailwind classes on the outer wrapper */
  className?: string;
}

export function TabBar({ tabs, activeTab, onChange, className }: TabBarProps) {
  return (
    <div
      role="tablist"
      aria-label="Page sections"
      className={`flex gap-0 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-x-auto scrollbar-none ${className ?? ''}`}
    >
      {tabs.map(tab => {
        const isActive = tab.id === activeTab;
        const Icon = tab.icon;

        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            id={`tab-${tab.id}`}
            aria-selected={isActive}
            aria-controls={`tabpanel-${tab.id}`}
            onClick={() => onChange(tab.id)}
            className={[
              'relative inline-flex items-center gap-2 px-5 py-3.5 text-sm font-semibold whitespace-nowrap',
              'transition-colors duration-150 rounded-t-lg shrink-0',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-violet-500',
              isActive
                ? 'text-violet-600 dark:text-violet-400'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800/40',
            ].join(' ')}
          >
            {Icon && <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />}
            {tab.label}

            {/* Count badge */}
            {tab.count !== undefined && (
              <span
                className={`ml-0.5 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-[10px] font-bold tabular-nums ${
                  isActive
                    ? 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300'
                    : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'
                }`}
              >
                {tab.count}
              </span>
            )}

            {/* Active underline */}
            {isActive && (
              <span
                className="absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-violet-500 to-fuchsia-500 rounded-full"
                aria-hidden="true"
              />
            )}
          </button>
        );
      })}
    </div>
  );
}

export default TabBar;
