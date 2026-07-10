// yss_orbit\frontend\src\modules\health\types\healthTypes.ts
export interface HealthDependency {
  name: string;
  status: 'OK' | 'DEGRADED' | 'DOWN';
  latencyMs: number;
  error?: string;
}

export interface HealthStatus {
  status: 'OK' | 'DEGRADED' | 'DOWN';
  version: string;
  uptime: string;
  timestamp: string;
  dependencies: HealthDependency[];
}
