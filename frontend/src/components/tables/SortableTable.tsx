// yss_orbit\frontend\src\components\tables\SortableTable.tsx
import React from 'react';

interface SortableTableProps {
  className?: string;
  children?: React.ReactNode;
}

export const SortableTable: React.FC<SortableTableProps> = ({ className = '', children }) => {
  return (
    <div className={`sortabletable ${className}`}>
      {children || <span>SortableTable Component</span>}
    </div>
  );
};
