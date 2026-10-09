import type { CookieOptions, Request, Response } from 'express';

import { ApiException } from '@starter/api/common';

import {
  type AppPlatform,
  REFRESH_TOKEN_COOKIE,
  type TokenPair,
} from '@starter/shared/contracts';

import type { AuthSession } from './auth.service';

const MILLISECONDS_PER_DAY = 86_400_000;

const baseCookieOptions: CookieOptions = {
  httpOnly: true,
  secure: true,
  sameSite: 'strict',
  path: REFRESH_TOKEN_COOKIE.path,
};

/** Web gets the refresh token in an httpOnly cookie, native apps in the body (BE-4). */
export function cookieOptions(refreshTokenTtlDays: number): CookieOptions {
  return {
    ...baseCookieOptions,
    maxAge: refreshTokenTtlDays * MILLISECONDS_PER_DAY,
  };
}

export function sendSession(
  response: Response,
  session: AuthSession,
  platform: AppPlatform,
  refreshTokenTtlDays: number,
): TokenPair {
  const tokenPair: TokenPair = {
    accessToken: session.accessToken,
    expiresIn: session.expiresIn,
  };

  if (platform === 'web') {
    response.cookie(
      REFRESH_TOKEN_COOKIE.name,
      session.refreshToken,
      cookieOptions(refreshTokenTtlDays),
    );
    return tokenPair;
  }

  return { ...tokenPair, refreshToken: session.refreshToken };
}

export function clearRefreshTokenCookie(response: Response): void {
  response.clearCookie(REFRESH_TOKEN_COOKIE.name, baseCookieOptions);
}

/** Native apps send the token in the body; the web sends the cookie. */
export function readRefreshToken(
  request: Request,
  bodyRefreshToken: string | undefined,
  platform: AppPlatform,
): string {
  const cookies = request.cookies as
    | Record<string, string | undefined>
    | undefined;
  const refreshToken =
    platform === 'web'
      ? cookies?.[REFRESH_TOKEN_COOKIE.name]
      : bodyRefreshToken;

  if (!refreshToken) {
    throw new ApiException('REFRESH_TOKEN_INVALID', 'Missing refresh token');
  }

  return refreshToken;
}
