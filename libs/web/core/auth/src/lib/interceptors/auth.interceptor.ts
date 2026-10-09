import type {
  HttpHandlerFn,
  HttpInterceptorFn,
  HttpRequest,
} from '@angular/common/http';
import { inject } from '@angular/core';

import { catchError, from, switchMap, throwError } from 'rxjs';

import {
  API_CONFIG,
  isApiErrorWithCode,
  isApiRequest,
} from '@starter/web/core/http';

import { SessionService } from '../session/session.service';
import { RETRIED_AFTER_REFRESH, SKIP_AUTH_TOKEN } from './auth-context';

const withAccessToken = (
  request: HttpRequest<unknown>,
  accessToken: string | null,
): HttpRequest<unknown> =>
  accessToken
    ? request.clone({ setHeaders: { Authorization: `Bearer ${accessToken}` } })
    : request;

/**
 * Adds the access token to API requests (FE-13). On TOKEN_EXPIRED it refreshes once, lets
 * parallel requests wait for that refresh and retries each request once (FE-14).
 * Register it before apiErrorInterceptor so it sees mapped ApiRequestErrors.
 */
export const authInterceptor: HttpInterceptorFn = (
  request,
  next: HttpHandlerFn,
) => {
  const session = inject(SessionService);

  if (
    !isApiRequest(request.url, inject(API_CONFIG)) ||
    request.context.get(SKIP_AUTH_TOKEN)
  ) {
    return next(request);
  }

  return next(withAccessToken(request, session.accessToken())).pipe(
    catchError((error: unknown) => {
      if (
        !isApiErrorWithCode(error, 'TOKEN_EXPIRED') ||
        request.context.get(RETRIED_AFTER_REFRESH)
      ) {
        return throwError(() => error);
      }

      return from(session.refresh()).pipe(
        switchMap((isRefreshed) => {
          if (!isRefreshed) {
            return throwError(() => error);
          }

          const retry = request.clone({
            context: request.context.set(RETRIED_AFTER_REFRESH, true),
          });
          return next(withAccessToken(retry, session.accessToken()));
        }),
      );
    }),
  );
};
