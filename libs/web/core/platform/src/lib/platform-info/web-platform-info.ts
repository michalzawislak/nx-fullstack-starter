import { Injectable, signal } from '@angular/core';

import type { AppPlatform } from '@starter/shared/contracts';

import type { PlatformInfo } from './platform-info';

@Injectable()
export class WebPlatformInfo implements PlatformInfo {
  readonly platform = signal<AppPlatform>('web').asReadonly();
  readonly isNative = signal(false).asReadonly();
}
