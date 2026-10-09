import { TestBed } from '@angular/core/testing';

import { type Route, Router, UrlSegment, type UrlTree } from '@angular/router';

import {
  API,
  apiError,
  settle,
  setupAuthTesting,
  tokenPair,
} from '../testing.spec-helpers';
import { authGuard, guestGuard } from './auth.guards';

const runGuard = (guard: typeof authGuard, path: string) =>
  TestBed.runInInjectionContext(() =>
    guard(
      {} as Route,
      path
        .split('/')
        .filter(Boolean)
        .map((segment) => new UrlSegment(segment, {})),
    ),
  ) as Promise<boolean | UrlTree>;

describe('authGuard', () => {
  it('redirects anonymous users to the login page with a return URL', async () => {
    // Arrange
    const { httpMock } = setupAuthTesting();

    // Act
    const result = runGuard(authGuard, '/settings/profile');
    await settle();
    httpMock
      .expectOne(`${API}/v1/auth/refresh`)
      .flush(apiError(401, 'REFRESH_TOKEN_INVALID'), {
        status: 401,
        statusText: '',
      });

    // Assert
    const urlTree = (await result) as UrlTree;
    expect(TestBed.inject(Router).serializeUrl(urlTree)).toBe(
      '/login?returnUrl=%2Fsettings%2Fprofile',
    );
  });

  it('lets authenticated users through after the session is restored', async () => {
    // Arrange
    const { httpMock } = setupAuthTesting();

    // Act
    const result = runGuard(authGuard, '/');
    await settle();
    httpMock.expectOne(`${API}/v1/auth/refresh`).flush(tokenPair('access-1'));

    // Assert
    expect(await result).toBe(true);
  });
});

describe('guestGuard', () => {
  it('sends signed-in users home and lets anonymous users in', async () => {
    // Arrange
    const { httpMock } = setupAuthTesting();

    // Act
    const anonymous = runGuard(guestGuard, '/login');
    await settle();
    httpMock
      .expectOne(`${API}/v1/auth/refresh`)
      .flush(apiError(401, 'REFRESH_TOKEN_INVALID'), {
        status: 401,
        statusText: '',
      });
    const anonymousResult = await anonymous;
    TestBed.resetTestingModule();
    const { httpMock: secondHttpMock } = setupAuthTesting();
    const signedIn = runGuard(guestGuard, '/login');
    await settle();
    secondHttpMock
      .expectOne(`${API}/v1/auth/refresh`)
      .flush(tokenPair('access-1'));

    // Assert
    expect(anonymousResult).toBe(true);
    expect(
      TestBed.inject(Router).serializeUrl((await signedIn) as UrlTree),
    ).toBe('/');
  });
});
