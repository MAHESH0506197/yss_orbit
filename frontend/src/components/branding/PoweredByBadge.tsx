// yss_orbit\frontend\src\components\branding\PoweredByBadge.tsx
import React from 'react';

interface PoweredByBadgeProps {
  className?: string;
  children?: React.ReactNode;
}

export const PoweredByBadge: React.FC<PoweredByBadgeProps> = ({ className = '', children }) => {
  return (
    <div className={`poweredbybadge ${className}`}>
      {children || <span>PoweredByBadge Component</span>}
    </div>
  );
};
