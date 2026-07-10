// yss_orbit\frontend\src\components\feedback\ErrorBoundaryFallback.tsx
import React from 'react';

interface ErrorBoundaryFallbackProps {
  className?: string;
  children?: React.ReactNode;
}

export const ErrorBoundaryFallback: React.FC<ErrorBoundaryFallbackProps> = ({ className = '', children }) => {
  return (
    <div className={`errorboundaryfallback ${className}`}>
      {children || <span>ErrorBoundaryFallback Component</span>}
    </div>
  );
};
