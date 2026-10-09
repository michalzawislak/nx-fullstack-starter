import { InjectionToken, type Signal } from '@angular/core';

import type { AppPlatform } from '@starter/shared/contracts';

/** Where the app runs; drives conditional UI and the X-App-Platform header. */
export interface PlatformInfo {
  readonly platform: Signal<AppPlatform>;
  readonly isNative: Signal<boolean>;
}

export const PLATFORM_INFO = new InjectionToken<PlatformInfo>('PLATFORM_INFO');
