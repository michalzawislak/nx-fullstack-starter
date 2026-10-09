import { Injectable, signal } from '@angular/core';

import type { AppPlatform } from '@starter/shared/contracts';

import { detectAppPlatform } from '../runtime/detect-app-platform';
import type { PlatformInfo } from './platform-info';

@Injectable()
export class NativePlatformInfo implements PlatformInfo {
  readonly platform = signal<AppPlatform>(detectAppPlatform()).asReadonly();
  readonly isNative = signal(true).asReadonly();
}
