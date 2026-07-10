// yss_orbit/frontend/src/components/ui/ThemeToggle.tsx
import React from 'react';
// @ts-expect-error - Auto-patched TS2307
import { useTheme } from '@/utils/core/theme/ThemeProvider';
import { cn } from '../../utils/cn';
import { Moon, Sun, Monitor } from 'lucide-react';

interface ThemeToggleProps {
  /** If true, shows 3-way picker (light/dark/system). Default: simple toggle */
  extended?: boolean;
  className?: string;
}

export function ThemeToggle({ extended = false, className }: ThemeToggleProps) {
  const { theme, resolvedTheme, setTheme } = useTheme();

  if (extended) {
    return (
      <div
        className={cn(
          'flex items-center gap-0.5 rounded-lg border border-border bg-muted/40 p-1',
          className,
        )}
        role="group"
        aria-label="Theme selection"
      >
        {(
          [
            { value: 'light',  Icon: Sun,     label: 'Light'  },
            { value: 'system', Icon: Monitor, label: 'System' },
            { value: 'dark',   Icon: Moon,    label: 'Dark'   },
          ] as const
        ).map(({ value, Icon, label }) => (
          <button
            key={value}
            type="button"
            title={label}
            aria-label={label}
            aria-pressed={theme === value}
            onClick={() => setTheme(value)}
            className={cn(
              'flex h-7 w-7 items-center justify-center rounded-md transition-all duration-150',
              theme === value
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            <Icon size={14} />
          </button>
        ))}
      </div>
    );
  }

  // Simple toggle — cycles light → dark
  const isDark = resolvedTheme === 'dark';

  return (
    <button
      type="button"
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className={cn(
        'relative inline-flex h-9 w-9 items-center justify-center rounded-md transition-colors',
        'text-muted-foreground hover:bg-muted hover:text-foreground',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50',
        className,
      )}
    >
      {/* Sun icon */}
      <Sun
        size={18}
        className={cn(
          'absolute transition-all duration-300',
          isDark ? 'rotate-90 scale-0 opacity-0' : 'rotate-0 scale-100 opacity-100',
        )}
      />
      {/* Moon icon */}
      <Moon
        size={18}
        className={cn(
          'absolute transition-all duration-300',
          isDark ? 'rotate-0 scale-100 opacity-100' : '-rotate-90 scale-0 opacity-0',
        )}
      />
      <span className="sr-only">Toggle theme</span>
    </button>
  );
}
