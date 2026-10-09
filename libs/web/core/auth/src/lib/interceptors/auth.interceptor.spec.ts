import { HttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';

import { firstValueFrom } from 'rxjs';

import { ApiRequestError } from '@starter/web/core/http';

import { SessionService } from '../session/session.service';
import {
  API,
  apiError,
  settle,
  setupAuthTesting,
  tokenPair,
} from '../testing.spec-helpers';

const expired = { status: 401, statusText: 'Unauthorized' };

async function signIn(
  httpMock: ReturnType<typeof setupAuthTesting>['httpMock'],
  accessToken = 'access-1',
): Promise<void> {
  const login = TestBed.inject(SessionService).login({
    email: 'jane@example.com',
    password: 'correct-horse',
  });
  httpMock.expectOne(`${API}/v1/auth/login`).flush(tokenPair(accessToken));
  await login;
}

describe('authInterceptor', () => {
  it('adds the bearer token to API requests only', async () => {
    // Arrange
    const { httpMock } = setupAuthTesting();
    await signIn(httpMock);
    const http = TestBed.inject(HttpClient);

    // Act
    http.get(`${API}/v1/users/me`).subscribe();
    http.get('https://cdn.example.com/avatar.png').subscribe();

    // Assert
    expect(
      httpMock
        .expectOne(`${API}/v1/users/me`)
        .request.headers.get('Authorization'),
    ).toBe('Bearer access-1');
    expect(
      httpMock
        .expectOne('https://cdn.example.com/avatar.png')
        .request.headers.has('Authorization'),
    ).toBe(false);
  });

  it('refreshes once for parallel requests that hit TOKEN_EXPIRED and retries each once (FE-14)', async () => {
    // Arrange
    const { httpMock } = setupAuthTesting();
    await signIn(httpMock);
    const http = TestBed.inject(HttpClient);
    const requests = [
      firstValueFrom(http.get(`${API}/v1/users/me`)),
      firstValueFrom(http.get(`${API}/v1/app/config`)),
      firstValueFrom(http.get(`${API}/v1/users/me?again=1`)),
    ];

    // Act
    httpMock
      .expectOne(`${API}/v1/users/me`)
      .flush(apiError(401, 'TOKEN_EXPIRED'), expired);
    httpMock
      .expectOne(`${API}/v1/app/config`)
      .flush(apiError(401, 'TOKEN_EXPIRED'), expired);
    httpMock
      .expectOne(`${API}/v1/users/me?again=1`)
      .flush(apiError(401, 'TOKEN_EXPIRED'), expired);
    await settle();
    httpMock.expectOne(`${API}/v1/auth/refresh`).flush(tokenPair('access-2'));
    await settle();
    const retries = [
      httpMock.expectOne(`${API}/v1/users/me`),
      httpMock.expectOne(`${API}/v1/app/config`),
      httpMock.expectOne(`${API}/v1/users/me?again=1`),
    ];
    retries.forEach((retry, index) => retry.flush({ index }));

    // Assert
    expect(
      retries.map((retry) => retry.request.headers.get('Authorization')),
    ).toEqual(['Bearer access-2', 'Bearer access-2', 'Bearer access-2']);
    expect(await Promise.all(requests)).toEqual([
      { index: 0 },
      { index: 1 },
      { index: 2 },
    ]);
    httpMock.verify();
  });

  it('does not retry a second time when the retried request is rejected again', async () => {
    // Arrange
    const { httpMock } = setupAuthTesting();
    await signIn(httpMock);
    const request = firstValueFrom(
      TestBed.inject(HttpClient).get(`${API}/v1/users/me`),
    );

    // Act
    httpMock
      .expectOne(`${API}/v1/users/me`)
      .flush(apiError(401, 'TOKEN_EXPIRED'), expired);
    await settle();
    httpMock.expectOne(`${API}/v1/auth/refresh`).flush(tokenPair('access-2'));
    await settle();
    httpMock
      .expectOne(`${API}/v1/users/me`)
      .flush(apiError(401, 'TOKEN_EXPIRED'), expired);

    // Assert
    await expect(request).rejects.toBeInstanceOf(ApiRequestError);
    httpMock.verify();
  });

  it('passes the original error on when the refresh fails', async () => {
    // Arrange
    const { httpMock } = setupAuthTesting();
    await signIn(httpMock);
    const request = firstValueFrom(
      TestBed.inject(HttpClient).get(`${API}/v1/users/me`),
    );

    // Act
    httpMock
      .expectOne(`${API}/v1/users/me`)
      .flush(apiError(401, 'TOKEN_EXPIRED'), expired);
    await settle();
    httpMock
      .expectOne(`${API}/v1/auth/refresh`)
      .flush(apiError(401, 'REFRESH_TOKEN_INVALID'), expired);

    // Assert
    const error = (await request.catch(
      (caught: unknown) => caught,
    )) as ApiRequestError;
    expect(error.errorCode).toBe('TOKEN_EXPIRED');
    expect(TestBed.inject(SessionService).status()).toBe('anonymous');
  });

  it('does not refresh on other errors', async () => {
    // Arrange
    const { httpMock } = setupAuthTesting();
    await signIn(httpMock);
    const request = firstValueFrom(
      TestBed.inject(HttpClient).get(`${API}/v1/users/me`),
    );

    // Act
    httpMock
      .expectOne(`${API}/v1/users/me`)
      .flush(apiError(401, 'UNAUTHENTICATED'), expired);

    // Assert
    await expect(request).rejects.toBeInstanceOf(ApiRequestError);
    httpMock.verify();
  });
});
