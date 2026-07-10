// yss_orbit\frontend\src\design_system\components\Button\Button.tsx
import React from 'react';
export interface ButtonProps { children?: React.ReactNode; [key: string]: unknown; }
export const Button: React.FC<ButtonProps> = ({ children }) => React.createElement('div', null, children);

