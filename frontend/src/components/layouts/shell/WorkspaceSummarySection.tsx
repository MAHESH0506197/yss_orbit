import React from 'react';
import { useWorkspaceStore } from '@/store/useWorkspaceStore';
import { HeaderStats } from '../header/HeaderStats';

export function WorkspaceSummarySection() {
  const statistics = useWorkspaceStore(state => state.statistics);

  if (!statistics || statistics.length === 0) return null;

  return (
    <div className="w-full max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-4">
      <HeaderStats stats={statistics} />
    </div>
  );
}
