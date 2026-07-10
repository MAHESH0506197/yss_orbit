// yss_orbit\frontend\src\modules\dashboard\types\dashboardTypes.ts
export interface DashboardWidget {
  id: string;
  type: 'stat' | 'chart' | 'table' | 'list';
  title: string;
  dataSource?: string;
  position: number;
  width: 1 | 2 | 3;
}

export interface DashboardConfig {
  userId: number;
  widgets: DashboardWidget[];
  theme?: string;
}
