import { Capacitor } from '@capacitor/core';

import type { AppPlatform } from '@starter/shared/contracts';

/**
 * Where the app runs, known synchronously before Angular starts. Use it only where a token
 * cannot be injected yet (app.config.ts); everywhere else inject PLATFORM_INFO.
 */
export function detectAppPlatform(): AppPlatform {
  const platform = Capacitor.getPlatform();
  return platform === 'ios' || platform === 'android' ? platform : 'web';
}
