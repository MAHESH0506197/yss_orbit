// Color foundations — HSL-based palette
export const colors = {
  primary:   { 50: '#eff6ff', 100: '#dbeafe', 500: '#3b82f6', 600: '#2563eb', 700: '#1d4ed8', 900: '#1e3a5f' },
  secondary: { 50: '#f5f3ff', 100: '#ede9fe', 500: '#8b5cf6', 600: '#7c3aed', 700: '#6d28d9' },
  success:   { 50: '#f0fdf4', 500: '#22c55e', 600: '#16a34a' },
  warning:   { 50: '#fffbeb', 500: '#f59e0b', 600: '#d97706' },
  danger:    { 50: '#fef2f2', 500: '#ef4444', 600: '#dc2626' },
  neutral:   { 50: '#f9fafb', 100: '#f3f4f6', 200: '#e5e7eb', 500: '#6b7280', 700: '#374151', 900: '#111827' },
} as const;
