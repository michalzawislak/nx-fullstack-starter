import {
  type EnvironmentProviders,
  inject,
  InjectionToken,
  makeEnvironmentProviders,
  provideAppInitializer,
} from '@angular/core';

import { SessionService } from './session/session.service';

export interface AuthRoutes {
  readonly login: string;
  readonly home: string;
}

export const AUTH_ROUTES = new InjectionToken<AuthRoutes>('AUTH_ROUTES', {
  factory: () => ({ login: '/login', home: '/' }),
});

/** Session restore at startup and the routes used by the guards. */
export function provideAuth(
  routes: Partial<AuthRoutes> = {},
): EnvironmentProviders {
  return makeEnvironmentProviders([
    {
      provide: AUTH_ROUTES,
      useValue: { login: '/login', home: '/', ...routes },
    },
    provideAppInitializer(() => {
      // Do not block the first render: guards await restore() themselves.
      void inject(SessionService).restore();
    }),
  ]);
}
