import type { AppPlatform } from '@starter/shared/contracts';

import type { AppEnvironment } from '../environments/app-environment';

/** API origin for the platform the app runs on: the override when there is one, the default otherwise. */
export function resolveApiBaseUrl(
  environment: AppEnvironment,
  platform: AppPlatform,
): string {
  return environment.apiBaseUrlOverrides?.[platform] ?? environment.apiBaseUrl;
}
