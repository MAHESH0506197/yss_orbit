import React from 'react';
import { Search, Download, Filter, MoreHorizontal } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Input } from './Input';

interface WorkspaceToolbarProps {
  searchPlaceholder?: string;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  filters?: React.ReactNode;
  actions?: React.ReactNode;
}

export function WorkspaceToolbar({
  searchPlaceholder,
  searchValue,
  onSearchChange,
  filters,
  actions,
}: WorkspaceToolbarProps) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 w-full bg-background border border-border/60 rounded-xl p-3 shadow-sm mb-4">
      {/* Left side: Search & Primary Filters */}
      <div className="flex flex-1 items-center gap-3 w-full md:max-w-md">
        {onSearchChange && (
          <Input
            placeholder={searchPlaceholder || t('toolbar.search', 'Search...')}
            value={searchValue || ''}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full bg-muted/40 border-border/50 hover:bg-muted/60 transition-colors focus-visible:ring-1"
            iconLeft={<Search className="h-4 w-4 text-muted-foreground" />}
          />
        )}
        {filters && (
          <div className="hidden sm:flex items-center gap-2">
            {filters}
          </div>
        )}
      </div>

      {/* Right side: Actions, Bulk, Export */}
      <div className="flex items-center gap-2 shrink-0 self-end md:self-auto">
        {actions && (
          <div className="flex items-center gap-2">
            {actions}
          </div>
        )}
        {/* Mobile Filters Toggle */}
        {filters && (
          <button className="sm:hidden flex items-center justify-center h-9 w-9 rounded-md border border-border/50 bg-background text-muted-foreground hover:bg-muted transition-colors">
            <Filter className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}
