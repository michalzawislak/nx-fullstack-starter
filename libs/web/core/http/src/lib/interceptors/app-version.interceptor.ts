import type { HttpInterceptorFn } from '@angular/common/http';
import { inject, InjectionToken } from '@angular/core';

import { catchError, throwError } from 'rxjs';

import { Router } from '@angular/router';

import { isApiErrorWithCode } from '../errors/api-request-error';

/** Route of the "update required" screen (MOB-11). */
export const UPDATE_REQUIRED_ROUTE = new InjectionToken<string>(
  'UPDATE_REQUIRED_ROUTE',
  {
    factory: () => '/update-required',
  },
);

/**
 * Sends the user to the update screen when the API rejects this app version with
 * APP_VERSION_UNSUPPORTED (CON-6, MOB-11). Register it before apiErrorInterceptor.
 */
export const appVersionInterceptor: HttpInterceptorFn = (request, next) => {
  const router = inject(Router);
  const updateRequiredRoute = inject(UPDATE_REQUIRED_ROUTE);

  return next(request).pipe(
    catchError((error: unknown) => {
      if (isApiErrorWithCode(error, 'APP_VERSION_UNSUPPORTED')) {
        void router.navigateByUrl(updateRequiredRoute, { replaceUrl: true });
      }

      return throwError(() => error);
    }),
  );
};
