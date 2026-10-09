import { DestroyRef, inject, Injectable, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { Network } from '@capacitor/network';

import { fromPluginEvent } from '../runtime/plugin-events';
import type { NetworkStatus } from './network-status';

/** @capacitor/network. Starts as online until the first native answer, like navigator.onLine. */
@Injectable()
export class NativeNetworkStatus implements NetworkStatus {
  private readonly online = signal(true);

  readonly isOnline = this.online.asReadonly();

  constructor() {
    fromPluginEvent<{ connected: boolean }>((listener) =>
      Network.addListener('networkStatusChange', listener),
    )
      .pipe(takeUntilDestroyed(inject(DestroyRef)))
      .subscribe(({ connected }) => this.online.set(connected));

    void Network.getStatus().then(({ connected }) =>
      this.online.set(connected),
    );
  }
}
