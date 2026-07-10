import React from 'react';

// Lazy load widgets for performance
const StatsOverviewWidget = React.lazy(() => import('../widgets/StatsOverviewWidget').then(m => ({ default: m.StatsOverviewWidget })));
const SystemHealthWidget = React.lazy(() => import('../widgets/SystemHealthWidget').then(m => ({ default: m.SystemHealthWidget })));
const RecentActivityWidget = React.lazy(() => import('../widgets/RecentActivityWidget').then(m => ({ default: m.RecentActivityWidget })));

const FallbackWidget: React.FC<{ type: string }> = ({ type }) => (
  <div className="bg-red-50 dark:bg-red-950/20 text-red-500 rounded-xl p-6 border border-red-200 dark:border-red-900 flex items-center justify-center">
    Widget "{type}" not found in registry.
  </div>
);

const LoadingWidget = () => (
  <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 h-full animate-pulse flex items-center justify-center text-gray-400">
    Initializing component...
  </div>
);

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() { return { hasError: true }; }
  render() {
    if (this.state.hasError) {
      return (
        <div className="bg-red-50 text-red-500 rounded-xl p-4 border border-red-200 flex flex-col items-center justify-center text-sm">
          Failed to render widget.
        </div>
      );
    }
    return this.props.children;
  }
}

export const WidgetRegistry: React.FC<{ type: string }> = ({ type }) => {
  let WidgetComponent: React.ComponentType | null = null;

  switch (type) {
    case 'stats_overview':
      WidgetComponent = StatsOverviewWidget;
      break;
    case 'system_health':
      WidgetComponent = SystemHealthWidget;
      break;
    case 'recent_activity':
      WidgetComponent = RecentActivityWidget;
      break;
    default:
      WidgetComponent = () => <FallbackWidget type={type} />;
  }

  return (
    <ErrorBoundary>
      <React.Suspense fallback={<LoadingWidget />}>
        <WidgetComponent />
      </React.Suspense>
    </ErrorBoundary>
  );
};
