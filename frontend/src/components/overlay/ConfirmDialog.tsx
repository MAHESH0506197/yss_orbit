// yss_orbit\frontend\src\components\overlay\ConfirmDialog.tsx
import React from 'react';

interface ConfirmDialogProps {
  className?: string;
  children?: React.ReactNode;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({ className = '', children }) => {
  return (
    <div className={`confirmdialog ${className}`}>
      {children || <span>ConfirmDialog Component</span>}
    </div>
  );
};
