// yss_orbit\frontend\src\components\tables\ColumnToggle.tsx
import React from 'react';

interface ColumnToggleProps {
  className?: string;
  children?: React.ReactNode;
}

export const ColumnToggle: React.FC<ColumnToggleProps> = ({ className = '', children }) => {
  return (
    <div className={`columntoggle ${className}`}>
      {children || <span>ColumnToggle Component</span>}
    </div>
  );
};
