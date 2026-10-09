import { provideHttpClient, withInterceptors } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { provideRouter } from '@angular/router';

import {
  apiErrorInterceptor,
  appHeadersInterceptor,
  provideApiConfig,
} from '@starter/web/core/http';
import {
  createPlatformTestingHandles,
  type PlatformTestingHandles,
  providePlatformTesting,
} from '@starter/web/core/platform';

import { authInterceptor } from './interceptors/auth.interceptor';
import { AUTH_ROUTES } from './provide-auth';

export const API = 'https://api.test';

export const tokenPair = (
  accessToken: string,
  refreshToken?: string,
  expiresIn = 900,
) => ({
  accessToken,
  expiresIn,
  ...(refreshToken ? { refreshToken } : {}),
});

export const apiError = (statusCode: number, errorCode: string) => ({
  statusCode,
  errorCode,
  message: errorCode,
});

/** Lets promise chains (storage reads, refresh) reach the next HTTP call. */
export const settle = (): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, 0));

export function setupAuthTesting(): {
  httpMock: HttpTestingController;
  platform: PlatformTestingHandles;
} {
  const platform = createPlatformTestingHandles();
  TestBed.configureTestingModule({
    providers: [
      provideHttpClient(
        withInterceptors([
          appHeadersInterceptor,
          authInterceptor,
          apiErrorInterceptor,
        ]),
      ),
      provideHttpClientTesting(),
      provideApiConfig({ baseUrl: API, appVersion: '1.0.0' }),
      providePlatformTesting(platform),
      provideRouter([]),
      { provide: AUTH_ROUTES, useValue: { login: '/login', home: '/' } },
    ],
  });
  return { httpMock: TestBed.inject(HttpTestingController), platform };
}
