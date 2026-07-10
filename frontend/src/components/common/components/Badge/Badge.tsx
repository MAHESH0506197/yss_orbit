// yss_orbit\frontend\src\design_system\components\Badge\Badge.tsx
import React from 'react';
export interface BadgeProps { children?: React.ReactNode; [key: string]: unknown; }
export const Badge: React.FC<BadgeProps> = ({ children }) => React.createElement('div', null, children);

