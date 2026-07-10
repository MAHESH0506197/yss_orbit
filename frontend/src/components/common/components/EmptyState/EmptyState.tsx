// yss_orbit\frontend\src\design_system\components\EmptyState\EmptyState.tsx
import React from 'react';
export interface EmptyStateProps { children?: React.ReactNode; [key: string]: unknown; }
export const EmptyState: React.FC<EmptyStateProps> = ({ children }) => React.createElement('div', null, children);

