import {
  DestroyRef,
  DOCUMENT,
  inject,
  Injectable,
  signal,
} from '@angular/core';

import type { NetworkStatus } from './network-status';

/** navigator.onLine plus the online and offline events. */
@Injectable()
export class WebNetworkStatus implements NetworkStatus {
  private readonly window = inject(DOCUMENT).defaultView;
  private readonly online = signal(this.window?.navigator.onLine ?? true);

  readonly isOnline = this.online.asReadonly();

  constructor() {
    const updateStatus = (): void =>
      this.online.set(this.window?.navigator.onLine ?? true);

    this.window?.addEventListener('online', updateStatus);
    this.window?.addEventListener('offline', updateStatus);
    inject(DestroyRef).onDestroy(() => {
      this.window?.removeEventListener('online', updateStatus);
      this.window?.removeEventListener('offline', updateStatus);
    });
  }
}
