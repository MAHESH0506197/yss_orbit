// yss_orbit\frontend\src\modules\branding\state\brandingSlice.ts
import { create } from 'zustand';

interface BrandingState {
    data: any[];
    loading: boolean;
    error: string | null;
    setData: (data: any[]) => void;
    setLoading: (loading: boolean) => void;
    setError: (error: string | null) => void;
}

export const useBrandingStore = create<BrandingState>((set) => ({
    data: [],
    loading: false,
    error: null,
    setData: (data) => set({ data }),
    setLoading: (loading) => set({ loading }),
    setError: (error) => set({ error }),
}));
