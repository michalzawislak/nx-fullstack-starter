import {
  type EnvironmentProviders,
  makeEnvironmentProviders,
  type Provider,
} from '@angular/core';

import { Capacitor } from '@capacitor/core';

import { APP_LIFECYCLE } from './lifecycle/app-lifecycle';
import { NativeAppLifecycle } from './lifecycle/native-app-lifecycle';
import { WebAppLifecycle } from './lifecycle/web-app-lifecycle';
import { NativeNetworkStatus } from './network/native-network-status';
import { NETWORK_STATUS } from './network/network-status';
import { WebNetworkStatus } from './network/web-network-status';
import { NativePlatformInfo } from './platform-info/native-platform-info';
import { PLATFORM_INFO } from './platform-info/platform-info';
import { WebPlatformInfo } from './platform-info/web-platform-info';
import { KEY_VALUE_STORAGE, SECURE_STORAGE } from './storage/key-value-storage';
import { MemoryKeyValueStorage } from './storage/memory-key-value-storage';
import { NativeKeyValueStorage } from './storage/native-key-value-storage';
import { NativeSecureStorage } from './storage/native-secure-storage';
import { WebKeyValueStorage } from './storage/web-key-value-storage';
import { NativeSystemUi } from './system-ui/native-system-ui';
import { SYSTEM_UI } from './system-ui/system-ui';
import { WebSystemUi } from './system-ui/web-system-ui';

const webProviders: Provider[] = [
  { provide: PLATFORM_INFO, useClass: WebPlatformInfo },
  { provide: KEY_VALUE_STORAGE, useClass: WebKeyValueStorage },
  // The web refresh token is an httpOnly cookie; secrets never outlive the page.
  { provide: SECURE_STORAGE, useFactory: () => new MemoryKeyValueStorage() },
  { provide: NETWORK_STATUS, useClass: WebNetworkStatus },
  { provide: APP_LIFECYCLE, useClass: WebAppLifecycle },
  { provide: SYSTEM_UI, useClass: WebSystemUi },
];

const nativeProviders: Provider[] = [
  { provide: PLATFORM_INFO, useClass: NativePlatformInfo },
  { provide: KEY_VALUE_STORAGE, useClass: NativeKeyValueStorage },
  { provide: SECURE_STORAGE, useClass: NativeSecureStorage },
  { provide: NETWORK_STATUS, useClass: NativeNetworkStatus },
  { provide: APP_LIFECYCLE, useClass: NativeAppLifecycle },
  { provide: SYSTEM_UI, useClass: NativeSystemUi },
];

/** Registers the platform implementations once, in app.config.ts (FE-9): native inside Capacitor, web otherwise. */
export function providePlatform(): EnvironmentProviders {
  return makeEnvironmentProviders(
    Capacitor.isNativePlatform() ? nativeProviders : webProviders,
  );
}
