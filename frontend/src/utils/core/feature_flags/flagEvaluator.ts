// yss_orbit\frontend\src\core\feature_flags\flagEvaluator.ts
import { appConfig } from '../../app/config/appConfig';
import { FEATURE_FLAGS } from './featureFlags';

export const isFeatureEnabled = (flagName: string): boolean => {
  // In reality, this would query a LaunchDarkly/ConfigCat wrapper or a Tenant Context
  // For now, we stub based on appConfig
  
  const mockFlags: Record<string, boolean> = {
    [FEATURE_FLAGS.MULTI_TENANT]: appConfig.features.enableMultiTenant,
    [FEATURE_FLAGS.NEW_DASHBOARD]: false,
    [FEATURE_FLAGS.BETA_REPORTING]: true,
  };

  return mockFlags[flagName] ?? false;
};
