// yss_orbit\frontend\src\layouts\error\NotFoundPage.tsx
import React from 'react';

interface NotFoundPageProps {
  className?: string;
  children?: React.ReactNode;
}

export const NotFoundPage: React.FC<NotFoundPageProps> = ({ className = '', children }) => {
  return (
    <div className={`notfoundpage ${className}`}>
      {children || <span>NotFoundPage Component</span>}
    </div>
  );
};
