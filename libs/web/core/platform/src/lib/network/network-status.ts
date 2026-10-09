import { InjectionToken, type Signal } from '@angular/core';

/** Connectivity as a signal (FE-10, FE-16, MOB-10). */
export interface NetworkStatus {
  readonly isOnline: Signal<boolean>;
}

export const NETWORK_STATUS = new InjectionToken<NetworkStatus>(
  'NETWORK_STATUS',
);
