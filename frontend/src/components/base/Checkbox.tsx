// yss_orbit\frontend\src\components\base\Checkbox.tsx
import React from 'react';

interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className = '', label, ...props }, ref) => {
    return (
      <label className="flex items-center space-x-2">
        <input type="checkbox" ref={ref} className={`rounded border-gray-300 text-blue-600 focus:ring-blue-500 ${className}`} {...props} />
        {label && <span className="text-sm font-medium text-gray-700">{label}</span>}
      </label>
    );
  }
);
Checkbox.displayName = 'Checkbox';
