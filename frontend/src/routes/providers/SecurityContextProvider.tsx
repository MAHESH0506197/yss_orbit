// yss_orbit\frontend\src\app\providers\SecurityContextProvider.tsx
import React from 'react';
import { useStore } from 'zustand';

export const SecurityContextProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    return (
        <>{children}</>
    );
};
export default SecurityContextProvider;
