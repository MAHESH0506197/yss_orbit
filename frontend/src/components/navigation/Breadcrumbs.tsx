// yss_orbit\frontend\src\components\navigation\Breadcrumbs.tsx
import React from 'react';

interface BreadcrumbsProps {
  className?: string;
  children?: React.ReactNode;
}

export const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ className = '', children }) => {
  return (
    <div className={`breadcrumbs ${className}`}>
      {children || <span>Breadcrumbs Component</span>}
    </div>
  );
};
