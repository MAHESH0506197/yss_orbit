// yss_orbit\frontend\src\components\layouts\shell\PlatformShell.tsx
/**
 * One-line fix: paddingLeft values updated to match Sidebar.tsx widths.
 *   collapsed: 64px → 72px   (sidebar is w-[72px])
 *   expanded:  240px → 260px  (sidebar is w-[260px])
 */
import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from '../sidebar/Sidebar';
import { Header } from '../header/Header';
import { PrivateBackground } from '@/components/background/PrivateBackground';
import { useSidebarStore } from './useSidebarStore';
import { WorkspaceSummarySection } from './WorkspaceSummarySection';

export default function PlatformShell() {
  const { isCollapsed, sidebarWidth } = useSidebarStore();

  const paddingLeft = isCollapsed ? '72px' : `${sidebarWidth}px`;

  return (
    <div className="min-h-screen bg-[var(--private-bg)] text-foreground font-sans transition-colors duration-200">
      {/* Ambient background for authenticated area */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden="true">
        <PrivateBackground />
      </div>

      <Sidebar />

      <div
        className="flex flex-col min-h-screen transition-all duration-300"
        style={{ paddingLeft }}
      >
        <Header />
        <WorkspaceSummarySection />

        <main className="flex-1 w-full max-w-7xl mx-auto p-4 md:p-6 lg:p-8 relative">
          <Outlet />
        </main>
      </div>
    </div>
  );
}