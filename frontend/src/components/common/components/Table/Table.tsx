// yss_orbit\frontend\src\design_system\components\Table\Table.tsx
import React from 'react';
export interface TableProps { children?: React.ReactNode; [key: string]: unknown; }
export const Table: React.FC<TableProps> = ({ children }) => React.createElement('div', null, children);

