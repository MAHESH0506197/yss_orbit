// yss_orbit\frontend\src\modules\welcome\components\SectionDivider.tsx
import React from 'react';

interface SectionDividerProps {
  variant?: 1 | 2 | 3 | 4 | 5;
  flip?: boolean;
  className?: string;
}

export default function SectionDivider({ variant = 1, flip = false, className = '' }: SectionDividerProps) {
  const baseStyle = "absolute left-0 w-full pointer-events-none";
  const posStyle = flip ? "top-0" : "bottom-0";
  
  return (
    <div className={`${baseStyle} ${posStyle} ${className} h-[2px] w-full`} style={{ zIndex: 10 }}>
      <style>
        {`
          @keyframes slidePulse {
            0% { transform: translateX(-100%); opacity: 0; }
            50% { opacity: 1; }
            100% { transform: translateX(200%); opacity: 0; }
          }
          .animate-pulse-line {
            animation: slidePulse 8s cubic-bezier(0.4, 0, 0.2, 1) infinite;
          }
        `}
      </style>
      
      {/* Base subtle line */}
      <div className="absolute inset-0 w-full h-[1px] bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
      
      {/* Glowing moving pulse */}
      <div className="absolute top-0 left-0 h-[2px] w-[30%] bg-gradient-to-r from-transparent via-primary to-transparent animate-pulse-line" style={{ filter: 'drop-shadow(0 0 8px hsl(var(--primary)))' }} />
      
      {/* Secondary slower pulse for depth */}
      <div className="absolute top-0 left-0 h-[1px] w-[50%] bg-gradient-to-r from-transparent via-primary/50 to-transparent animate-pulse-line" style={{ animationDuration: '12s', animationDelay: '3s' }} />
    </div>
  );
}
