import {
  HttpErrorResponse,
  type HttpInterceptorFn,
} from '@angular/common/http';
import { inject } from '@angular/core';

import { catchError, throwError } from 'rxjs';

import { parseApiError } from '@starter/shared/contracts';

import { API_CONFIG, isApiRequest } from '../api-config';
import { ApiRequestError, NetworkError } from '../errors/api-request-error';

const NETWORK_FAILURE_STATUS = 0;

/** Maps HTTP failures of API requests to ApiRequestError or NetworkError (FE-15, FE-16). */
export const apiErrorInterceptor: HttpInterceptorFn = (request, next) => {
  if (!isApiRequest(request.url, inject(API_CONFIG))) {
    return next(request);
  }

  return next(request).pipe(
    catchError((error: unknown) => {
      if (!(error instanceof HttpErrorResponse)) {
        return throwError(() => error);
      }

      if (error.status === NETWORK_FAILURE_STATUS) {
        return throwError(() => new NetworkError());
      }

      return throwError(
        () => new ApiRequestError(parseApiError(error.error, error.status)),
      );
    }),
  );
};
