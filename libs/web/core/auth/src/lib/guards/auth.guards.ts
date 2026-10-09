import { inject } from '@angular/core';

import { type CanMatchFn, Router, type UrlSegment } from '@angular/router';

import { AUTH_ROUTES } from '../provide-auth';
import { SessionService } from '../session/session.service';

const toUrl = (segments: UrlSegment[]): string =>
  `/${segments.map((segment) => segment.path).join('/')}`;

// inject() works only before the first await, so every dependency is read up front.

/** Routes for signed-in users; others go to the login page with a return URL. */
export const authGuard: CanMatchFn = async (_route, segments) => {
  const session = inject(SessionService);
  const router = inject(Router);
  const authRoutes = inject(AUTH_ROUTES);

  await session.restore();

  return session.isAuthenticated()
    ? true
    : router.createUrlTree([authRoutes.login], {
        queryParams: { returnUrl: toUrl(segments) },
      });
};

/** Routes for signed-out users (login, register); signed-in users go home. */
export const guestGuard: CanMatchFn = async () => {
  const session = inject(SessionService);
  const router = inject(Router);
  const authRoutes = inject(AUTH_ROUTES);

  await session.restore();

  return session.isAuthenticated()
    ? router.createUrlTree([authRoutes.home])
    : true;
};
