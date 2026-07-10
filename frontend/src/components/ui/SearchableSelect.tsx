import React from 'react';
import Select, { Props as SelectProps, components } from 'react-select';

interface Option {
  value: string;
  label: string;
}

interface SearchableSelectProps extends Omit<SelectProps<Option, false>, 'options' | 'value' | 'onChange'> {
  options: Option[];
  value: string | null | undefined;
  onChange: (value: string | null) => void;
  hasError?: boolean;
}

export const SearchableSelect: React.FC<SearchableSelectProps> = ({ 
  options, 
  value, 
  onChange, 
  hasError,
  ...props 
}) => {
  const selectedOption = options.find(opt => opt.value === value) || null;

  return (
    <Select
      value={selectedOption}
      onChange={(newVal) => onChange(newVal ? newVal.value : null)}
      options={options}
      isClearable
      isSearchable
      styles={{
        control: (base, state) => ({
          ...base,
          minHeight: '2.75rem',
          borderRadius: '0.75rem',
          borderWidth: '1px',
          borderColor: hasError 
            ? '#fb7185' // rose-400
            : state.isFocused ? '#6366f1' : '#e5e7eb', // indigo-500 or gray-200
          boxShadow: state.isFocused 
            ? `0 0 0 4px ${hasError ? 'rgba(244, 63, 94, 0.2)' : 'rgba(99, 102, 241, 0.2)'}` 
            : 'none',
          backgroundColor: hasError ? 'rgba(255, 228, 230, 0.3)' : '#f9fafb',
          transition: 'all 0.2s ease',
          '&:hover': {
            borderColor: hasError ? '#f43f5e' : '#d1d5db',
            backgroundColor: '#ffffff'
          }
        }),
        menu: (base) => ({
          ...base,
          borderRadius: '0.75rem',
          overflow: 'hidden',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
          border: '1px solid #e5e7eb',
          zIndex: 50
        }),
        option: (base, state) => ({
          ...base,
          backgroundColor: state.isSelected 
            ? '#6366f1' 
            : state.isFocused ? '#f3f4f6' : 'transparent',
          color: state.isSelected ? '#ffffff' : '#111827',
          cursor: 'pointer',
          fontSize: '0.875rem',
          '&:active': {
            backgroundColor: '#818cf8'
          }
        }),
        input: (base) => ({
          ...base,
          'input:focus': {
            boxShadow: 'none',
          },
          fontSize: '0.875rem',
        }),
        singleValue: (base) => ({
          ...base,
          fontSize: '0.875rem',
          color: '#111827',
        }),
        placeholder: (base) => ({
          ...base,
          fontSize: '0.875rem',
          color: '#9ca3af',
        }),
        menuPortal: base => ({ ...base, zIndex: 9999 }),
      }}
      components={{
        IndicatorSeparator: () => null
      }}
      menuPortalTarget={document.body}
      classNames={{
        control: () => 'dark:bg-gray-900/50 dark:border-gray-700',
        menu: () => 'dark:bg-gray-800 dark:border-gray-700',
        option: () => 'dark:text-gray-200 dark:hover:bg-gray-700'
      }}
      {...props}
    />
  );
};
