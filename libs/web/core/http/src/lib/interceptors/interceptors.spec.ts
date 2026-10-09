import { HttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';

import { firstValueFrom } from 'rxjs';

import { ApiRequestError, NetworkError } from '../errors/api-request-error';
import { setupHttpTesting, TEST_API_URL } from '../testing.spec-helpers';

describe('appHeadersInterceptor', () => {
  it('adds X-App-Version and X-App-Platform to API requests only (FE-13)', () => {
    // Arrange
    const { httpMock, platform } = setupHttpTesting();
    platform.platformInfo.setPlatform('ios');
    const http = TestBed.inject(HttpClient);

    // Act
    http.get(`${TEST_API_URL}/health`).subscribe();
    http.get('https://cdn.example.com/file').subscribe();

    // Assert
    const apiRequest = httpMock.expectOne(`${TEST_API_URL}/health`).request;
    const externalRequest = httpMock.expectOne(
      'https://cdn.example.com/file',
    ).request;
    expect(apiRequest.headers.get('X-App-Version')).toBe('1.2.3');
    expect(apiRequest.headers.get('X-App-Platform')).toBe('ios');
    expect(externalRequest.headers.has('X-App-Version')).toBe(false);
  });
});

describe('apiErrorInterceptor', () => {
  it('maps an API error body to ApiRequestError with its errorCode (FE-15)', async () => {
    // Arrange
    const { httpMock } = setupHttpTesting();
    const request = firstValueFrom(
      TestBed.inject(HttpClient).get(`${TEST_API_URL}/v1/users/me`),
    );

    // Act
    httpMock
      .expectOne(`${TEST_API_URL}/v1/users/me`)
      .flush(
        { statusCode: 401, errorCode: 'TOKEN_EXPIRED', message: 'expired' },
        { status: 401, statusText: 'Unauthorized' },
      );

    // Assert
    const error = await request.catch((caught: unknown) => caught);
    expect(error).toBeInstanceOf(ApiRequestError);
    expect((error as ApiRequestError).errorCode).toBe('TOKEN_EXPIRED');
  });

  it('maps a failure without a response to NetworkError (FE-16)', async () => {
    // Arrange
    const { httpMock } = setupHttpTesting();
    const request = firstValueFrom(
      TestBed.inject(HttpClient).get(`${TEST_API_URL}/health`),
    );

    // Act
    httpMock
      .expectOne(`${TEST_API_URL}/health`)
      .error(new ProgressEvent('error'), { status: 0 });

    // Assert
    await expect(request).rejects.toBeInstanceOf(NetworkError);
  });

  it('leaves errors of other hosts untouched', async () => {
    // Arrange
    const { httpMock } = setupHttpTesting();
    const request = firstValueFrom(
      TestBed.inject(HttpClient).get('https://cdn.example.com/file'),
    );

    // Act
    httpMock
      .expectOne('https://cdn.example.com/file')
      .flush('nope', { status: 404, statusText: 'Not Found' });

    // Assert
    const error = await request.catch((caught: unknown) => caught);
    expect(error).not.toBeInstanceOf(ApiRequestError);
  });
});
