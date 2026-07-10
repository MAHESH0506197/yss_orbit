// yss_orbit\frontend\src\components\tables\FilterBar.tsx
import React from 'react';

interface FilterBarProps {
  className?: string;
  children?: React.ReactNode;
}

export const FilterBar: React.FC<FilterBarProps> = ({ className = '', children }) => {
  return (
    <div className={`filterbar ${className}`}>
      {children || <span>FilterBar Component</span>}
    </div>
  );
};
