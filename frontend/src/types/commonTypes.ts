// yss_orbit\frontend\src\core\types\commonTypes.ts
export type ID = string | number;

export interface BaseEntity {
  id: ID;
  createdAt?: string;
  updatedAt?: string;
}
