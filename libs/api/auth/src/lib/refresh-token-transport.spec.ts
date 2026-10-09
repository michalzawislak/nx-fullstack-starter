import type { Request, Response } from 'express';

import { REFRESH_TOKEN_COOKIE } from '@starter/shared/contracts';

import {
  clearRefreshTokenCookie,
  readRefreshToken,
  sendSession,
} from './refresh-token-transport';

const session = {
  accessToken: 'access',
  refreshToken: 'refresh',
  expiresIn: 900,
};

const createResponse = () =>
  ({ cookie: vi.fn(), clearCookie: vi.fn() }) as unknown as Response & {
    cookie: ReturnType<typeof vi.fn>;
    clearCookie: ReturnType<typeof vi.fn>;
  };

describe('sendSession', () => {
  it('puts the refresh token in a cookie for the web and leaves it out of the body', () => {
    // Arrange
    const response = createResponse();

    // Act
    const body = sendSession(response, session, 'web', 30);

    // Assert
    expect(body).toEqual({ accessToken: 'access', expiresIn: 900 });
    expect(response.cookie).toHaveBeenCalledWith(
      REFRESH_TOKEN_COOKIE.name,
      'refresh',
      expect.objectContaining({
        httpOnly: true,
        secure: true,
        sameSite: 'strict',
        path: '/v1/auth',
        maxAge: 2_592_000_000,
      }),
    );
  });

  it('returns the refresh token in the body for native apps', () => {
    // Arrange
    const response = createResponse();

    // Act
    const body = sendSession(response, session, 'android', 30);

    // Assert
    expect(body).toEqual({
      accessToken: 'access',
      refreshToken: 'refresh',
      expiresIn: 900,
    });
    expect(response.cookie).not.toHaveBeenCalled();
  });
});

describe('readRefreshToken', () => {
  const request = {
    cookies: { [REFRESH_TOKEN_COOKIE.name]: 'from-cookie' },
  } as unknown as Request;

  it('reads the cookie on the web and the body on native', () => {
    // Act & Assert
    expect(readRefreshToken(request, 'from-body', 'web')).toBe('from-cookie');
    expect(readRefreshToken(request, 'from-body', 'ios')).toBe('from-body');
  });

  it('fails with REFRESH_TOKEN_INVALID when the token is missing', () => {
    // Act
    const read = (): string =>
      readRefreshToken({ cookies: {} } as unknown as Request, undefined, 'web');

    // Assert
    expect(read).toThrow(
      expect.objectContaining({ errorCode: 'REFRESH_TOKEN_INVALID' }),
    );
  });
});

describe('clearRefreshTokenCookie', () => {
  it('clears the cookie with the same path and flags', () => {
    // Arrange
    const response = createResponse();

    // Act
    clearRefreshTokenCookie(response);

    // Assert
    expect(response.clearCookie).toHaveBeenCalledWith(
      REFRESH_TOKEN_COOKIE.name,
      expect.objectContaining({ path: '/v1/auth', httpOnly: true }),
    );
  });
});
