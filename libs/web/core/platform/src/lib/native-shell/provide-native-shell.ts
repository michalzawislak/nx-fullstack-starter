import { Location } from '@angular/common';
import {
  afterNextRender,
  DestroyRef,
  type EnvironmentProviders,
  inject,
  provideAppInitializer,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { Router } from '@angular/router';

import {
  APP_LIFECYCLE,
  type AppLifecycleEvent,
} from '../lifecycle/app-lifecycle';
import { SYSTEM_UI } from '../system-ui/system-ui';

export interface NativeShellOptions {
  /** Screens where the Android back button minimises the app instead of going back (MOB-5). */
  readonly rootPaths?: readonly string[];
}

const DEFAULT_ROOT_PATHS: readonly string[] = ['/', '/login'];

/**
 * Native app behaviour (PRD 6.4): back button (MOB-5), deep links (MOB-7), keyboard (MOB-8),
 * status bar and splash screen (MOB-9). Safe on the web, where the platform tokens never emit
 * these events and SYSTEM_UI does nothing. Register after providePlatform() and provideRouter().
 */
export function provideNativeShell(
  options: NativeShellOptions = {},
): EnvironmentProviders {
  const rootPaths = options.rootPaths ?? DEFAULT_ROOT_PATHS;

  return provideAppInitializer(() => {
    const lifecycle = inject(APP_LIFECYCLE);
    const systemUi = inject(SYSTEM_UI);
    const router = inject(Router);
    const location = inject(Location);
    const destroyRef = inject(DestroyRef);

    const handleEvent = (event: AppLifecycleEvent): void => {
      if (event.type === 'back-button') {
        const currentPath = router.url.split(/[?#]/)[0] ?? '/';

        if (event.canGoBack && !rootPaths.includes(currentPath)) {
          location.back();
        } else {
          void lifecycle.minimize();
        }
      } else if (event.type === 'url-open') {
        void router.navigateByUrl(event.path);
      }
    };

    lifecycle.events
      .pipe(takeUntilDestroyed(destroyRef))
      .subscribe(handleEvent);
    destroyRef.onDestroy(systemUi.keepFocusedFieldVisible());
    void systemUi.applyStatusBarStyle();

    // The splash screen stays until the first real frame, not for a fixed time (MOB-9).
    afterNextRender(() => void systemUi.hideSplashScreen());
  });
}
