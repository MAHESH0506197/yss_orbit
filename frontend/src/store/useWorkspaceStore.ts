import { create } from 'zustand';

export interface WorkspaceStat {
  id: string;
  label: string;
  value: string | number;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  icon?: React.ReactNode;
}

export interface WorkspaceAction {
  id: string;
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  primary?: boolean;
}

export interface WorkspaceContextBadge {
  label: string;
  color?: 'default' | 'primary' | 'success' | 'warning' | 'error' | 'info';
}

interface WorkspaceState {
  pageTitle: string | null;
  moduleBadge: WorkspaceContextBadge | null;
  environmentBadge: WorkspaceContextBadge | null;
  statistics: WorkspaceStat[];
  actions: WorkspaceAction[];
  
  setContext: (context: WorkspaceContextProps) => void;
  clearContext: () => void;
}

export type WorkspaceContextProps = Partial<Omit<WorkspaceState, 'setContext' | 'clearContext'>>;

export const useWorkspaceStore = create<WorkspaceState>((set) => ({
  pageTitle: null,
  moduleBadge: null,
  environmentBadge: null,
  statistics: [],
  actions: [],
  
  setContext: (context) => set((state) => ({ ...state, ...context })),
  clearContext: () => set({
    pageTitle: null,
    moduleBadge: null,
    environmentBadge: null,
    statistics: [],
    actions: [],
  }),
}));
