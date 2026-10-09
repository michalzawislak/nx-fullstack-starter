import { TestBed } from '@angular/core/testing';

import {
  API,
  apiError,
  settle,
  setupAuthTesting,
  tokenPair,
} from '../testing.spec-helpers';
import { SessionService } from './session.service';

describe('SessionService', () => {
  it('starts as unknown and becomes authenticated after login', async () => {
    // Arrange
    const { httpMock } = setupAuthTesting();
    const session = TestBed.inject(SessionService);
    const initialStatus = session.status();

    // Act
    const login = session.login({
      email: 'jane@example.com',
      password: 'correct-horse',
    });
    httpMock.expectOne(`${API}/v1/auth/login`).flush(tokenPair('access-1'));
    await login;

    // Assert
    expect(initialStatus).toBe('unknown');
    expect(session.isAuthenticated()).toBe(true);
    expect(session.accessToken()).toBe('access-1');
  });

  it('keeps the refresh token in secure storage on native and never on the web (MOB-12)', async () => {
    // Arrange
    const { httpMock, platform } = setupAuthTesting();
    platform.platformInfo.setPlatform('ios');
    const session = TestBed.inject(SessionService);

    // Act
    const register = session.register({
      email: 'jane@example.com',
      password: 'correct-horse',
    });
    httpMock
      .expectOne(`${API}/v1/auth/register`)
      .flush(tokenPair('access-1', 'refresh-1'));
    await register;

    // Assert
    expect(await platform.secureStorage.get('auth.refresh-token')).toBe(
      'refresh-1',
    );
    expect(await platform.keyValueStorage.get('auth.refresh-token')).toBeNull();
  });

  it('restores the session from the stored refresh token on native', async () => {
    // Arrange
    const { httpMock, platform } = setupAuthTesting();
    platform.platformInfo.setPlatform('android');
    await platform.secureStorage.set('auth.refresh-token', 'refresh-1');
    const session = TestBed.inject(SessionService);

    // Act
    const restore = session.restore();
    await settle();
    const refreshRequest = httpMock.expectOne(`${API}/v1/auth/refresh`);
    refreshRequest.flush(tokenPair('access-2', 'refresh-2'));
    await restore;

    // Assert
    expect(refreshRequest.request.body).toEqual({ refreshToken: 'refresh-1' });
    expect(session.accessToken()).toBe('access-2');
    expect(await platform.secureStorage.get('auth.refresh-token')).toBe(
      'refresh-2',
    );
  });

  it('shares one refresh request between parallel callers (FE-14)', async () => {
    // Arrange
    const { httpMock } = setupAuthTesting();
    const session = TestBed.inject(SessionService);

    // Act
    const first = session.refresh();
    const second = session.refresh();
    await settle();
    httpMock.expectOne(`${API}/v1/auth/refresh`).flush(tokenPair('access-2'));

    // Assert
    expect(await Promise.all([first, second])).toEqual([true, true]);
    httpMock.verify();
  });

  it('ends the session and clears the token when the refresh token is invalid', async () => {
    // Arrange
    const { httpMock, platform } = setupAuthTesting();
    platform.platformInfo.setPlatform('ios');
    await platform.secureStorage.set('auth.refresh-token', 'revoked');
    const session = TestBed.inject(SessionService);

    // Act
    const restore = session.restore();
    await settle();
    httpMock
      .expectOne(`${API}/v1/auth/refresh`)
      .flush(apiError(401, 'REFRESH_TOKEN_INVALID'), {
        status: 401,
        statusText: 'Unauthorized',
      });
    await restore;

    // Assert
    expect(session.status()).toBe('anonymous');
    expect(await platform.secureStorage.get('auth.refresh-token')).toBeNull();
  });

  it('keeps the stored token when offline at startup and restores once back online (MOB-10)', async () => {
    // Arrange
    const { httpMock, platform } = setupAuthTesting();
    platform.platformInfo.setPlatform('ios');
    platform.network.setOnline(false);
    await platform.secureStorage.set('auth.refresh-token', 'refresh-1');
    const session = TestBed.inject(SessionService);

    // Act
    const restore = session.restore();
    await settle();
    httpMock
      .expectOne(`${API}/v1/auth/refresh`)
      .error(new ProgressEvent('error'), { status: 0 });
    await restore;
    const statusWhileOffline = session.status();
    platform.network.setOnline(true);
    TestBed.tick();
    await settle();
    httpMock
      .expectOne(`${API}/v1/auth/refresh`)
      .flush(tokenPair('access-2', 'refresh-2'));
    await settle();

    // Assert
    expect(statusWhileOffline).toBe('anonymous');
    expect(session.isAuthenticated()).toBe(true);
  });

  it('logs out locally even when the API call fails', async () => {
    // Arrange
    const { httpMock } = setupAuthTesting();
    const session = TestBed.inject(SessionService);
    const login = session.login({
      email: 'jane@example.com',
      password: 'correct-horse',
    });
    httpMock.expectOne(`${API}/v1/auth/login`).flush(tokenPair('access-1'));
    await login;

    // Act
    const logout = session.logout();
    await settle();
    const logoutRequest = httpMock.expectOne(`${API}/v1/auth/logout`);
    logoutRequest.error(new ProgressEvent('error'), { status: 0 });
    await logout;

    // Assert
    expect(logoutRequest.request.headers.get('Authorization')).toBe(
      'Bearer access-1',
    );
    expect(session.status()).toBe('anonymous');
  });

  it('refreshes an expired access token when the app resumes (MOB-6)', async () => {
    // Arrange
    const { httpMock, platform } = setupAuthTesting();
    const session = TestBed.inject(SessionService);
    const login = session.login({
      email: 'jane@example.com',
      password: 'correct-horse',
    });
    httpMock
      .expectOne(`${API}/v1/auth/login`)
      .flush(tokenPair('access-1', undefined, 1));
    await login;

    // Act
    platform.lifecycle.emit({ type: 'resume' });
    await settle();
    httpMock.expectOne(`${API}/v1/auth/refresh`).flush(tokenPair('access-2'));
    await settle();

    // Assert
    expect(session.accessToken()).toBe('access-2');
  });
});
