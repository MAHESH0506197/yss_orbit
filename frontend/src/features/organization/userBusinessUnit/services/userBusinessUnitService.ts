// yss_orbit\frontend\src\modules\userBusinessUnit\services\userBusinessUnitService.ts
/**
 * Frontend service layer for UserBusinessUnit — thin wrapper around the API.
 * Components should use the Zustand store; this is for direct calls.
 */
import { userBusinessUnitApi } from '../api/userBusinessUnitApi';
import type {
  UserBusinessUnitMembership,
  UserBusinessUnitCreatePayload,
  UserBusinessUnitUpdatePayload,
  UserBusinessUnitFilters,
} from '../types/userBusinessUnitTypes';

export const userBusinessUnitService = {
  getAll: (filters?: UserBusinessUnitFilters) =>
    userBusinessUnitApi.getAll(filters),

  getById: (id: string): Promise<UserBusinessUnitMembership> =>
    userBusinessUnitApi.getById(id),

  create: (data: UserBusinessUnitCreatePayload): Promise<UserBusinessUnitMembership> =>
    userBusinessUnitApi.create(data),

  update: (id: string, data: UserBusinessUnitUpdatePayload): Promise<UserBusinessUnitMembership> =>
    userBusinessUnitApi.update(id, data),

  patch: (id: string, data: UserBusinessUnitUpdatePayload): Promise<UserBusinessUnitMembership> =>
    userBusinessUnitApi.patch(id, data),

  delete: (id: string): Promise<void> =>
    userBusinessUnitApi.delete(id),

  deactivate: (id: string): Promise<UserBusinessUnitMembership> =>
    userBusinessUnitApi.deactivate(id),

  activate: (id: string): Promise<UserBusinessUnitMembership> =>
    userBusinessUnitApi.activate(id),
};
