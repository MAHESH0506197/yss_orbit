// src/components/navigation/Tabs.tsx
import React, { createContext, useContext, useId, useRef } from 'react';
import { LucideIcon } from 'lucide-react';
import { cn } from '../../utils/cn';

// ─── Types ────────────────────────────────────────────────────────────────────

export type TabsVariant = 'underline' | 'pills' | 'enclosed' | 'segment';

export interface TabItem {
  value: string;
  label: string;
  icon?: LucideIcon;
  /** Small badge count */
  count?: number;
  disabled?: boolean;
}

export interface TabsProps {
  tabs: TabItem[];
  value: string;
  onChange: (value: string) => void;
  variant?: TabsVariant;
  size?: 'sm' | 'md' | 'lg';
  /** Stretch tabs to fill full width */
  fullWidth?: boolean;
  className?: string;
  /** Panel content keyed by tab value */
  children?: React.ReactNode;
}

// ─── Context (for TabPanel) ───────────────────────────────────────────────────

const TabsCtx = createContext<{ active: string; idPrefix: string }>({ active: '', idPrefix: '' });

// ─── Variant styles ───────────────────────────────────────────────────────────

const variantWrap: Record<TabsVariant, string> = {
  underline: 'border-b border-border gap-0',
  pills:     'gap-1 p-0',
  enclosed:  'border border-border rounded-xl gap-0 p-1 bg-muted/40',
  segment:   'bg-muted rounded-xl p-1 gap-1',
};

const variantTab: Record<TabsVariant, { base: string; active: string; inactive: string }> = {
  underline: {
    base:     'relative border-b-2 border-transparent rounded-none transition-all duration-200',
    active:   'border-primary text-primary font-semibold',
    inactive: 'text-muted-foreground hover:text-foreground hover:border-border',
  },
  pills: {
    base:     'rounded-lg transition-all duration-200',
    active:   'bg-primary text-primary-foreground shadow-sm font-semibold',
    inactive: 'text-muted-foreground hover:bg-muted hover:text-foreground',
  },
  enclosed: {
    base:     'rounded-lg transition-all duration-200',
    active:   'bg-background text-foreground shadow-sm font-semibold',
    inactive: 'text-muted-foreground hover:text-foreground',
  },
  segment: {
    base:     'rounded-lg transition-all duration-200',
    active:   'bg-background text-foreground shadow-sm font-semibold',
    inactive: 'text-muted-foreground hover:text-foreground/80',
  },
};

const SIZE_CLS: Record<string, string> = {
  sm: 'px-3 py-1.5 text-xs gap-1.5',
  md: 'px-4 py-2 text-sm gap-2',
  lg: 'px-5 py-2.5 text-base gap-2.5',
};

// ─── Component ───────────────────────────────────────────────────────────────

export const Tabs: React.FC<TabsProps> = ({
  tabs,
  value,
  onChange,
  variant = 'underline',
  size = 'md',
  fullWidth = false,
  className,
  children,
}) => {
  const idPrefix = useId();
  const listRef  = useRef<HTMLDivElement>(null);

  const handleKeyDown = (e: React.KeyboardEvent, currentIdx: number) => {
    const enabled = tabs.filter(t => !t.disabled);
    const currentEnabledIdx = enabled.findIndex(t => t.value === (tabs[currentIdx]?.value ?? ''));
    let target: TabItem | undefined;

    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      target = enabled[(currentEnabledIdx + 1) % enabled.length];
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      target = enabled[(currentEnabledIdx - 1 + enabled.length) % enabled.length];
    } else if (e.key === 'Home') {
      target = enabled[0];
    } else if (e.key === 'End') {
      target = enabled[enabled.length - 1];
    }

    if (target) {
      e.preventDefault();
      onChange(target.value);
      // Focus the newly selected tab
      setTimeout(() => {
        const btn = listRef.current?.querySelector<HTMLButtonElement>(`[data-tab="${target!.value}"]`);
        btn?.focus();
      }, 0);
    }
  };

  const { base, active: activeCls, inactive: inactiveCls } = variantTab[variant];

  return (
    <TabsCtx.Provider value={{ active: value, idPrefix }}>
      <div className={cn('w-full', className)}>
        {/* Tab list */}
        <div
          ref={listRef}
          role="tablist"
          aria-orientation="horizontal"
          className={cn(
            'flex items-center overflow-x-auto scrollbar-none',
            variantWrap[variant],
            fullWidth ? 'w-full' : '',
          )}
        >
          {tabs.map((tab, idx) => {
            const Icon     = tab.icon;
            const isActive = tab.value === value;

            return (
              <button
                key={tab.value}
                type="button"
                role="tab"
                data-tab={tab.value}
                id={`${idPrefix}-tab-${tab.value}`}
                aria-selected={isActive}
                aria-controls={`${idPrefix}-panel-${tab.value}`}
                tabIndex={isActive ? 0 : -1}
                disabled={tab.disabled}
                onClick={() => !tab.disabled && onChange(tab.value)}
                onKeyDown={(e) => handleKeyDown(e, idx)}
                className={cn(
                  'inline-flex items-center justify-center whitespace-nowrap font-medium shrink-0',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1',
                  'disabled:opacity-40 disabled:pointer-events-none',
                  'transition-all duration-150',
                  fullWidth && 'flex-1',
                  SIZE_CLS[size],
                  base,
                  isActive ? activeCls : inactiveCls,
                )}
              >
                {Icon && <Icon size={size === 'sm' ? 13 : size === 'lg' ? 17 : 15} strokeWidth={2} aria-hidden="true" />}
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span
                    className={cn(
                      'ml-0.5 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold tabular-nums',
                      isActive
                        ? (variant === 'pills' ? 'bg-white/20 text-white' : 'bg-primary/10 text-primary')
                        : 'bg-muted text-muted-foreground',
                    )}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Tab panels */}
        {children && (
          <div className="mt-4">
            {children}
          </div>
        )}
      </div>
    </TabsCtx.Provider>
  );
};

// ─── TabPanel ─────────────────────────────────────────────────────────────────

export interface TabPanelProps {
  value: string;
  children: React.ReactNode;
  className?: string;
}

export const TabPanel: React.FC<TabPanelProps> = ({ value, children, className }) => {
  const { active, idPrefix } = useContext(TabsCtx);
  const isActive = value === active;

  return (
    <div
      id={`${idPrefix}-panel-${value}`}
      role="tabpanel"
      aria-labelledby={`${idPrefix}-tab-${value}`}
      hidden={!isActive}
      tabIndex={0}
      className={cn(
        'focus-visible:outline-none',
        isActive ? 'animate-in fade-in duration-200' : '',
        className,
      )}
    >
      {isActive && children}
    </div>
  );
};

export default Tabs;
