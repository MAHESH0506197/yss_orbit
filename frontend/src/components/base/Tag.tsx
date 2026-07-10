// yss_orbit\frontend\src\components\base\Tag.tsx
import React from 'react';

interface TagProps {
  className?: string;
  children?: React.ReactNode;
}

export const Tag: React.FC<TagProps> = ({ className = '', children }) => {
  return (
    <div className={`tag ${className}`}>
      {children || <span>Tag Component</span>}
    </div>
  );
};
