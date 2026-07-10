// yss_orbit\frontend\src\shared\hooks\useModuleAccess.ts
import { usePermissions } from './usePermissions';
export const useModuleAccess = (moduleName: string) => {
  const { hasPermission } = usePermissions();
  return {
    canAccess: hasPermission(`ACCESS_${moduleName.toUpperCase()}`)
  };
};
