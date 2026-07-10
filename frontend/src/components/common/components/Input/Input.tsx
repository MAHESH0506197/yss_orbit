// yss_orbit\frontend\src\design_system\components\Input\Input.tsx
import React from 'react';
export interface InputProps { children?: React.ReactNode; [key: string]: unknown; }
export const Input: React.FC<InputProps> = ({ children }) => React.createElement('div', null, children);

