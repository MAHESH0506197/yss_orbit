import React from 'react';
import { WorkspaceStat } from '@/store/useWorkspaceStore';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/utils/cn';

export function HeaderStats({ stats }: { stats: WorkspaceStat[] }) {
  if (!stats || stats.length === 0) return null;

  return (
    <div className="hidden md:flex flex-wrap items-center gap-3 pt-2 pb-3 px-4 md:px-6">
      {stats.map((stat) => (
        <div 
          key={stat.id} 
          className="flex items-center gap-3 rounded-lg border border-border bg-card shadow-sm px-3 py-2 flex-1 min-w-[150px] max-w-[250px]"
        >
          {stat.icon && (
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              {stat.icon}
            </div>
          )}
          <div className="flex flex-col min-w-0">
            <span className="text-xs font-medium text-muted-foreground truncate">{stat.label}</span>
            <div className="flex items-baseline gap-2">
              <span className="text-lg font-bold text-foreground truncate">{stat.value}</span>
              {stat.trend && (
                <span className={cn(
                  "flex items-center text-xs font-medium",
                  stat.trend.isPositive ? "text-green-600" : "text-red-600"
                )}>
                  {stat.trend.isPositive ? <TrendingUp size={12} className="mr-0.5" /> : <TrendingDown size={12} className="mr-0.5" />}
                  {stat.trend.value}%
                </span>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
