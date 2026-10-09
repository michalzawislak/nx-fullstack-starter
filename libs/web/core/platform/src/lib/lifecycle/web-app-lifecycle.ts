import { DOCUMENT, inject, Injectable } from '@angular/core';

import { fromEvent, map, type Observable, share } from 'rxjs';

import type { AppLifecycle, AppLifecycleEvent } from './app-lifecycle';

/** Page visibility mapped to pause and resume. Back button and deep links are native-only. */
@Injectable()
export class WebAppLifecycle implements AppLifecycle {
  private readonly document = inject(DOCUMENT);

  readonly events: Observable<AppLifecycleEvent> = fromEvent(
    this.document,
    'visibilitychange',
  ).pipe(
    map(
      (): AppLifecycleEvent => ({
        type: this.document.visibilityState === 'hidden' ? 'pause' : 'resume',
      }),
    ),
    share(),
  );

  async minimize(): Promise<void> {
    // Browsers cannot be minimised by a page.
  }
}
