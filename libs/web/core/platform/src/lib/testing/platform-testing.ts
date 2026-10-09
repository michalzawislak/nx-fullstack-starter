import {
  type EnvironmentProviders,
  makeEnvironmentProviders,
  signal,
} from '@angular/core';

import { Subject } from 'rxjs';

import type { AppPlatform } from '@starter/shared/contracts';

import {
  APP_LIFECYCLE,
  type AppLifecycle,
  type AppLifecycleEvent,
} from '../lifecycle/app-lifecycle';
import { NETWORK_STATUS, type NetworkStatus } from '../network/network-status';
import {
  PLATFORM_INFO,
  type PlatformInfo,
} from '../platform-info/platform-info';
import {
  KEY_VALUE_STORAGE,
  SECURE_STORAGE,
} from '../storage/key-value-storage';
import { MemoryKeyValueStorage } from '../storage/memory-key-value-storage';
import { SYSTEM_UI, type SystemUi } from '../system-ui/system-ui';

/** Controllable network status for tests. */
export class FakeNetworkStatus implements NetworkStatus {
  private readonly online = signal(true);
  readonly isOnline = this.online.asReadonly();

  setOnline(isOnline: boolean): void {
    this.online.set(isOnline);
  }
}

/** Lifecycle whose events tests emit by hand. */
export class FakeAppLifecycle implements AppLifecycle {
  private readonly subject = new Subject<AppLifecycleEvent>();
  readonly events = this.subject.asObservable();
  readonly minimize = async (): Promise<void> => undefined;

  emit(event: AppLifecycleEvent): void {
    this.subject.next(event);
  }
}

export class FakePlatformInfo implements PlatformInfo {
  private readonly currentPlatform = signal<AppPlatform>('web');
  private readonly native = signal(false);
  readonly platform = this.currentPlatform.asReadonly();
  readonly isNative = this.native.asReadonly();

  setPlatform(platform: AppPlatform): void {
    this.currentPlatform.set(platform);
    this.native.set(platform !== 'web');
  }
}

/** Records what the native shell asked of the system UI. */
export class FakeSystemUi implements SystemUi {
  splashScreenHideCount = 0;
  statusBarStyleCount = 0;
  isKeepingFocusedFieldVisible = false;

  async hideSplashScreen(): Promise<void> {
    this.splashScreenHideCount += 1;
  }

  async applyStatusBarStyle(): Promise<void> {
    this.statusBarStyleCount += 1;
  }

  keepFocusedFieldVisible(): () => void {
    this.isKeepingFocusedFieldVisible = true;
    return () => {
      this.isKeepingFocusedFieldVisible = false;
    };
  }
}

export interface PlatformTestingHandles {
  readonly network: FakeNetworkStatus;
  readonly lifecycle: FakeAppLifecycle;
  readonly platformInfo: FakePlatformInfo;
  readonly keyValueStorage: MemoryKeyValueStorage;
  readonly secureStorage: MemoryKeyValueStorage;
  readonly systemUi: FakeSystemUi;
}

/** In-memory implementations of every platform token (FE-11). Inspect or drive them through `handles`. */
export function providePlatformTesting(
  handles: PlatformTestingHandles = createPlatformTestingHandles(),
): EnvironmentProviders {
  return makeEnvironmentProviders([
    { provide: PLATFORM_INFO, useValue: handles.platformInfo },
    { provide: KEY_VALUE_STORAGE, useValue: handles.keyValueStorage },
    { provide: SECURE_STORAGE, useValue: handles.secureStorage },
    { provide: NETWORK_STATUS, useValue: handles.network },
    { provide: APP_LIFECYCLE, useValue: handles.lifecycle },
    { provide: SYSTEM_UI, useValue: handles.systemUi },
  ]);
}

export function createPlatformTestingHandles(): PlatformTestingHandles {
  return {
    network: new FakeNetworkStatus(),
    lifecycle: new FakeAppLifecycle(),
    platformInfo: new FakePlatformInfo(),
    keyValueStorage: new MemoryKeyValueStorage(),
    secureStorage: new MemoryKeyValueStorage(),
    systemUi: new FakeSystemUi(),
  };
}
