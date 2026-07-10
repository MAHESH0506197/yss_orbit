// yss_orbit\frontend\src\design_system\components\Spinner\Spinner.tsx
import React from 'react';
export interface SpinnerProps { children?: React.ReactNode; [key: string]: unknown; }
export const Spinner: React.FC<SpinnerProps> = ({ children }) => React.createElement('div', null, children);

