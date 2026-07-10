// yss_orbit\frontend\src\layouts\error\UnauthorizedPage.tsx
import React from 'react';

interface UnauthorizedPageProps {
  className?: string;
  children?: React.ReactNode;
}

export const UnauthorizedPage: React.FC<UnauthorizedPageProps> = ({ className = '', children }) => {
  return (
    <div className={`unauthorizedpage ${className}`}>
      {children || <span>UnauthorizedPage Component</span>}
    </div>
  );
};
