// yss_orbit\frontend\src\components\navigation\StepIndicator.tsx
import React from 'react';

interface StepIndicatorProps {
  className?: string;
  children?: React.ReactNode;
}

export const StepIndicator: React.FC<StepIndicatorProps> = ({ className = '', children }) => {
  return (
    <div className={`stepindicator ${className}`}>
      {children || <span>StepIndicator Component</span>}
    </div>
  );
};
