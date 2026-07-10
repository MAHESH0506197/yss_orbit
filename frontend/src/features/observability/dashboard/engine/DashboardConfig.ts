export interface WidgetConfig {
  id: string;
  type: string; // The widget ID mapped in WidgetRegistry (e.g. 'stats_overview')
  title: string;
  colSpan: number; // For CSS Grid layout (1 to 4)
  rowSpan: number;
}

export interface DashboardLayout {
  role: string;
  businessUnitId: string | null;
  widgets: WidgetConfig[];
}

export const DEFAULT_LAYOUT: DashboardLayout = {
  role: 'admin',
  businessUnitId: null,
  widgets: [
    {
      id: 'w_stats',
      type: 'stats_overview',
      title: 'Overview',
      colSpan: 4,
      rowSpan: 1,
    },
    {
      id: 'w_health',
      type: 'system_health',
      title: 'System Health',
      colSpan: 2,
      rowSpan: 2,
    },
    {
      id: 'w_activity',
      type: 'recent_activity',
      title: 'Recent Activity',
      colSpan: 2,
      rowSpan: 2,
    }
  ]
};
