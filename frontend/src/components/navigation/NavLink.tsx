// yss_orbit\frontend\src\components\navigation\NavLink.tsx
import React from 'react';

interface NavLinkProps {
  className?: string;
  children?: React.ReactNode;
}

export const NavLink: React.FC<NavLinkProps> = ({ className = '', children }) => {
  return (
    <div className={`navlink ${className}`}>
      {children || <span>NavLink Component</span>}
    </div>
  );
};
