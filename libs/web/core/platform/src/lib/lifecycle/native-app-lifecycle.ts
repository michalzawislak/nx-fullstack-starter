import { Injectable } from '@angular/core';

import { filter, map, merge, type Observable, share } from 'rxjs';

import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';

import { fromPluginEvent } from '../runtime/plugin-events';
import type { AppLifecycle, AppLifecycleEvent } from './app-lifecycle';
import { deepLinkPath } from './deep-link-path';

/**
 * @capacitor/app events. While anyone subscribes, the Android back button no longer closes
 * the app by itself; the native shell decides what back means (MOB-5).
 */
@Injectable()
export class NativeAppLifecycle implements AppLifecycle {
  readonly events: Observable<AppLifecycleEvent> = merge(
    fromPluginEvent<void>((listener) =>
      App.addListener('pause', listener),
    ).pipe(map((): AppLifecycleEvent => ({ type: 'pause' }))),
    fromPluginEvent<void>((listener) =>
      App.addListener('resume', listener),
    ).pipe(map((): AppLifecycleEvent => ({ type: 'resume' }))),
    fromPluginEvent<{ canGoBack: boolean }>((listener) =>
      App.addListener('backButton', listener),
    ).pipe(
      map(
        ({ canGoBack }): AppLifecycleEvent => ({
          type: 'back-button',
          canGoBack,
        }),
      ),
    ),
    fromPluginEvent<{ url: string }>((listener) =>
      App.addListener('appUrlOpen', listener),
    ).pipe(
      map(({ url }) => deepLinkPath(url)),
      filter((path) => path !== null),
      map((path): AppLifecycleEvent => ({ type: 'url-open', path })),
    ),
  ).pipe(share());

  async minimize(): Promise<void> {
    // iOS apps must not close or minimise themselves.
    if (Capacitor.getPlatform() === 'android') {
      await App.minimizeApp();
    }
  }
}
