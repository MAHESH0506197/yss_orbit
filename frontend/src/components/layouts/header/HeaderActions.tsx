import React, { useState, useRef, useEffect } from 'react';
import { WorkspaceAction } from '@/store/useWorkspaceStore';
import { MoreHorizontal } from 'lucide-react';
import { cn } from '@/utils/cn';
import { Button } from '@/components/ui/Button';

export function HeaderActions({ actions }: { actions: WorkspaceAction[] }) {
  const [isOverflowOpen, setIsOverflowOpen] = useState(false);
  const overflowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (overflowRef.current && !overflowRef.current.contains(event.target as Node)) {
        setIsOverflowOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!actions || actions.length === 0) return null;

  // Show max 2 actions directly on larger screens, rest in overflow
  const visibleActions = actions.slice(0, 2);
  const overflowActions = actions.slice(2);

  return (
    <div className="flex items-center gap-2">
      {/* Visible on Laptop/Desktop */}
      <div className="hidden lg:flex items-center gap-2">
        {visibleActions.map((action) => (
          <Button
            key={action.id}
            variant={action.primary ? 'primary' : 'outline'}
            size="sm"
            onClick={action.onClick}
            className="h-9 gap-1.5"
          >
            {action.icon && <span className="shrink-0">{action.icon}</span>}
            {action.label}
          </Button>
        ))}
      </div>

      {/* Overflow Menu (used for remaining items on desktop, or ALL items on mobile/tablet) */}
      <div className="relative" ref={overflowRef}>
        <Button
          variant={actions.some(a => a.primary) ? 'primary' : 'outline'}
          size="sm"
          className="h-9 lg:hidden gap-1.5"
          onClick={() => setIsOverflowOpen(!isOverflowOpen)}
        >
          Actions <MoreHorizontal size={16} />
        </Button>
        
        {overflowActions.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="h-9 w-9 p-0 hidden lg:flex"
            onClick={() => setIsOverflowOpen(!isOverflowOpen)}
          >
            <MoreHorizontal size={16} />
          </Button>
        )}

        {isOverflowOpen && (
          <div className="absolute right-0 mt-2 w-48 rounded-md border border-border bg-popover shadow-md z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="py-1">
              {/* On smaller screens, render ALL actions here */}
              <div className="lg:hidden">
                {actions.map((action) => (
                  <button
                    key={action.id}
                    onClick={() => { action.onClick(); setIsOverflowOpen(false); }}
                    className={cn(
                      "flex w-full items-center gap-2 px-4 py-2 text-sm transition-colors",
                      action.primary ? "font-semibold text-primary hover:bg-primary/10" : "text-popover-foreground hover:bg-muted"
                    )}
                  >
                    {action.icon}
                    {action.label}
                  </button>
                ))}
              </div>
              {/* On large screens, render only OVERFLOW actions here */}
              <div className="hidden lg:block">
                {overflowActions.map((action) => (
                  <button
                    key={action.id}
                    onClick={() => { action.onClick(); setIsOverflowOpen(false); }}
                    className={cn(
                      "flex w-full items-center gap-2 px-4 py-2 text-sm transition-colors",
                      action.primary ? "font-semibold text-primary hover:bg-primary/10" : "text-popover-foreground hover:bg-muted"
                    )}
                  >
                    {action.icon}
                    {action.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
