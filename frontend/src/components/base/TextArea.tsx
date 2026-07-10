// yss_orbit\frontend\src\components\base\TextArea.tsx
import React from 'react';

interface TextAreaProps {
  className?: string;
  children?: React.ReactNode;
}

export const TextArea: React.FC<TextAreaProps> = ({ className = '', children }) => {
  return (
    <div className={`textarea ${className}`}>
      {children || <span>TextArea Component</span>}
    </div>
  );
};
