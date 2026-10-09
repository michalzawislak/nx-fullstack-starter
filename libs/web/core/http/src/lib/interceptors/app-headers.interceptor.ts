import type { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';

import { PLATFORM_INFO } from '@starter/web/core/platform';

import { APP_HEADERS } from '@starter/shared/contracts';

import { API_CONFIG, isApiRequest } from '../api-config';

/** Adds X-App-Version and X-App-Platform to API requests (FE-13, CON-6). */
export const appHeadersInterceptor: HttpInterceptorFn = (request, next) => {
  const config = inject(API_CONFIG);

  if (!isApiRequest(request.url, config)) {
    return next(request);
  }

  return next(
    request.clone({
      setHeaders: {
        [APP_HEADERS.version]: config.appVersion,
        [APP_HEADERS.platform]: inject(PLATFORM_INFO).platform(),
      },
    }),
  );
};
