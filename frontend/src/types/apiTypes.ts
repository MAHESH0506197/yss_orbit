// yss_orbit\frontend\src\core\types\apiTypes.ts
export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface ApiResponse<T = any> {
  status: string;
  message: string;
  data?: T;
}
