import { useState, useEffect } from 'react';

export type ViewMode = 'grid' | 'table';
export type Density = 'comfortable' | 'compact';

export function useViewMode(entityKey: string, defaultMode: ViewMode = 'grid', defaultDensity: Density = 'comfortable') {
  // Read from localStorage on initial load
  const [viewMode, setViewModeState] = useState<ViewMode>(() => {
    try {
      const stored = localStorage.getItem(`viewMode.${entityKey}`);
      if (stored === 'grid' || stored === 'table') {
        return stored;
      }
    } catch (e) {
      console.error('Failed to read viewMode from localStorage', e);
    }
    return defaultMode;
  });

  // Write to localStorage whenever viewMode changes
  const setViewMode = (mode: ViewMode) => {
    setViewModeState(mode);
    try {
      localStorage.setItem(`viewMode.${entityKey}`, mode);
    } catch (e) {
      console.error('Failed to write viewMode to localStorage', e);
    }
  };

  const [density, setDensityState] = useState<Density>(() => {
    try {
      const stored = localStorage.getItem(`density.${entityKey}`);
      if (stored === 'comfortable' || stored === 'compact') {
        return stored;
      }
    } catch (e) {
      console.error('Failed to read density from localStorage', e);
    }
    return defaultDensity;
  });

  const setDensity = (newDensity: Density) => {
    setDensityState(newDensity);
    try {
      localStorage.setItem(`density.${entityKey}`, newDensity);
    } catch (e) {
      console.error('Failed to write density to localStorage', e);
    }
  };

  return [viewMode, setViewMode, density, setDensity] as const;
}
