import {
  type EnvironmentProviders,
  makeEnvironmentProviders,
} from '@angular/core';

import { APP_LIFECYCLE } from './lifecycle/app-lifecycle';
import { WebAppLifecycle } from './lifecycle/web-app-lifecycle';
import { NETWORK_STATUS } from './network/network-status';
import { WebNetworkStatus } from './network/web-network-status';
import { PLATFORM_INFO } from './platform-info/platform-info';
import { WebPlatformInfo } from './platform-info/web-platform-info';
import { KEY_VALUE_STORAGE, SECURE_STORAGE } from './storage/key-value-storage';
import { MemoryKeyValueStorage } from './storage/memory-key-value-storage';
import { WebKeyValueStorage } from './storage/web-key-value-storage';

/**
 * Registers the platform implementations once, in app.config.ts (FE-9).
 * Step 8 adds the native implementations, chosen with Capacitor.isNativePlatform().
 */
export function providePlatform(): EnvironmentProviders {
  return makeEnvironmentProviders([
    { provide: PLATFORM_INFO, useClass: WebPlatformInfo },
    { provide: KEY_VALUE_STORAGE, useClass: WebKeyValueStorage },
    { provide: SECURE_STORAGE, useFactory: () => new MemoryKeyValueStorage() },
    { provide: NETWORK_STATUS, useClass: WebNetworkStatus },
    { provide: APP_LIFECYCLE, useClass: WebAppLifecycle },
  ]);
}
