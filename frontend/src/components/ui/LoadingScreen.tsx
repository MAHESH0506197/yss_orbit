// yss_orbit/frontend/src/components/ui/LoadingScreen.tsx
import React from 'react';
import { cn } from '../../utils/cn';

export interface LoadingScreenProps {
  fullScreen?: boolean;
  text?: string;
  className?: string;
}

export function LoadingScreen({ fullScreen = true, text = "Loading…", className }: LoadingScreenProps) {
  return (
    <div className={cn(
      "flex flex-col items-center justify-center gap-5 bg-background",
      fullScreen ? "min-h-screen w-full" : "h-full w-full py-12",
      className
    )}>
      {/* Orbital spinner */}
      <div className="relative h-14 w-14">
        {/* Outer ring */}
        <span
          className="absolute inset-0 rounded-full border-2 border-primary/20"
          aria-hidden="true"
        />
        {/* Spinning arc */}
        <span
          className="absolute inset-0 animate-spin rounded-full border-2 border-transparent border-t-primary"
          style={{ animationDuration: '0.75s' }}
          aria-hidden="true"
        />
        {/* Inner pulse dot */}
        <span
          className="absolute inset-[18%] rounded-full bg-primary/30 animate-pulse"
          aria-hidden="true"
        />
      </div>

      {/* Brand wordmark */}
      <div className="flex flex-col items-center gap-1">
        <p className="font-mono text-sm font-semibold uppercase tracking-widest text-muted-foreground">
          YSS Orbit
        </p>
        <p className="text-xs text-muted-foreground/60">
          {text}
        </p>
      </div>
    </div>
  );
}
