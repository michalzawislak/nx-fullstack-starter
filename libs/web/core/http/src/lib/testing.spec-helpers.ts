import { provideHttpClient, withInterceptors } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import {
  createPlatformTestingHandles,
  type PlatformTestingHandles,
  providePlatformTesting,
} from '@starter/web/core/platform';

import { provideApiConfig } from './api-config';
import { apiErrorInterceptor } from './interceptors/api-error.interceptor';
import { appHeadersInterceptor } from './interceptors/app-headers.interceptor';

export const TEST_API_URL = 'https://api.test';

export function setupHttpTesting(): {
  httpMock: HttpTestingController;
  platform: PlatformTestingHandles;
} {
  const platform = createPlatformTestingHandles();
  TestBed.configureTestingModule({
    providers: [
      provideHttpClient(
        withInterceptors([appHeadersInterceptor, apiErrorInterceptor]),
      ),
      provideHttpClientTesting(),
      provideApiConfig({ baseUrl: `${TEST_API_URL}/`, appVersion: '1.2.3' }),
      providePlatformTesting(platform),
    ],
  });
  return { httpMock: TestBed.inject(HttpTestingController), platform };
}
