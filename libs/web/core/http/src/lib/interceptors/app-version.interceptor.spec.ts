import {
  HttpClient,
  provideHttpClient,
  withInterceptors,
} from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { firstValueFrom } from 'rxjs';

import { provideRouter, Router } from '@angular/router';

import { providePlatformTesting } from '@starter/web/core/platform';

import { provideApiConfig } from '../api-config';
import { apiErrorInterceptor } from './api-error.interceptor';
import { appVersionInterceptor } from './app-version.interceptor';

describe('appVersionInterceptor', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(
          withInterceptors([appVersionInterceptor, apiErrorInterceptor]),
        ),
        provideHttpClientTesting(),
        provideApiConfig({ baseUrl: 'https://api.test', appVersion: '1.0.0' }),
        providePlatformTesting(),
        provideRouter([]),
      ],
    });
  });

  it('opens the update screen on APP_VERSION_UNSUPPORTED (MOB-11)', async () => {
    // Arrange
    const navigate = vi
      .spyOn(TestBed.inject(Router), 'navigateByUrl')
      .mockResolvedValue(true);
    const request = firstValueFrom(
      TestBed.inject(HttpClient).get('https://api.test/v1/app/config'),
    );

    // Act
    TestBed.inject(HttpTestingController)
      .expectOne('https://api.test/v1/app/config')
      .flush(
        {
          statusCode: 426,
          errorCode: 'APP_VERSION_UNSUPPORTED',
          message: 'Update',
        },
        { status: 426, statusText: '' },
      );

    // Assert
    await expect(request).rejects.toMatchObject({
      errorCode: 'APP_VERSION_UNSUPPORTED',
    });
    expect(navigate).toHaveBeenCalledWith('/update-required', {
      replaceUrl: true,
    });
  });

  it('does not navigate on other errors', async () => {
    // Arrange
    const navigate = vi
      .spyOn(TestBed.inject(Router), 'navigateByUrl')
      .mockResolvedValue(true);
    const request = firstValueFrom(
      TestBed.inject(HttpClient).get('https://api.test/v1/users/me'),
    );

    // Act
    TestBed.inject(HttpTestingController)
      .expectOne('https://api.test/v1/users/me')
      .flush(
        { statusCode: 401, errorCode: 'UNAUTHENTICATED', message: 'No' },
        { status: 401, statusText: '' },
      );

    // Assert
    await expect(request).rejects.toBeDefined();
    expect(navigate).not.toHaveBeenCalled();
  });
});
