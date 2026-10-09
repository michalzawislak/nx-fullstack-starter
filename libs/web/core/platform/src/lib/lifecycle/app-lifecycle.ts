import { InjectionToken } from '@angular/core';

import type { Observable } from 'rxjs';

export type AppLifecycleEvent =
  | { readonly type: 'pause' }
  | { readonly type: 'resume' }
  /** Android hardware back button (MOB-5); never emitted on the web. */
  | { readonly type: 'back-button'; readonly canGoBack: boolean }
  /** A deep link opened the app (MOB-7); `path` includes query and hash. */
  | { readonly type: 'url-open'; readonly path: string };

/** App lifecycle as a stream of events: pause, resume, back button, deep links. */
export interface AppLifecycle {
  readonly events: Observable<AppLifecycleEvent>;
  /** Moves the app to the background (Android back on the home screen, MOB-5); no-op on the web. */
  minimize(): Promise<void>;
}

export const APP_LIFECYCLE = new InjectionToken<AppLifecycle>('APP_LIFECYCLE');
