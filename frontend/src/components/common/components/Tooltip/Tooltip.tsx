// yss_orbit\frontend\src\design_system\components\Tooltip\Tooltip.tsx
import React from 'react';
export interface TooltipProps { children?: React.ReactNode; [key: string]: unknown; }
export const Tooltip: React.FC<TooltipProps> = ({ children }) => React.createElement('div', null, children);

