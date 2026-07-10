// yss_orbit\frontend\src\components\branding\BrandLogo.tsx
import React from 'react';

interface BrandLogoProps {
  className?: string;
  children?: React.ReactNode;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({ className = '', children }) => {
  return (
    <div className={`brandlogo ${className}`}>
      {children || <span>BrandLogo Component</span>}
    </div>
  );
};
