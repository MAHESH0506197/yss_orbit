import React, { useEffect } from 'react';
import { useWorkspaceStore, WorkspaceContextProps } from '@/store/useWorkspaceStore';

export function WorkspaceHeader(props: WorkspaceContextProps) {
  const setContext = useWorkspaceStore((state) => state.setContext);
  const clearContext = useWorkspaceStore((state) => state.clearContext);

  useEffect(() => {
    setContext(props);
    return () => clearContext();
  }, [setContext, clearContext, JSON.stringify(props)]); // stringify to prevent infinite loops if passed inline

  return null;
}
