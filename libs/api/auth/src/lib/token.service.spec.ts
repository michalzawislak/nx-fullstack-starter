import { JwtService } from '@nestjs/jwt';

import type { AppConfig } from '@starter/api/common';

import { TokenService } from './token.service';

const config = { accessTokenTtlSeconds: 900 } as AppConfig;
const jwtService = new JwtService({
  secret: 'test-secret',
  verifyOptions: { algorithms: ['HS256'] },
});

describe('TokenService', () => {
  const tokenService = new TokenService(jwtService, config);

  it('signs an access token that verifies to the user id', async () => {
    // Arrange
    const accessToken = await tokenService.signAccessToken('user-1');

    // Act
    const verification = await tokenService.verifyAccessToken(accessToken);

    // Assert
    expect(verification).toEqual({ status: 'valid', userId: 'user-1' });
  });

  it('sets a 15-minute lifetime (BE-1)', async () => {
    // Arrange
    const accessToken = await tokenService.signAccessToken('user-1');

    // Act
    const payload = jwtService.decode<{ iat: number; exp: number }>(
      accessToken,
    );

    // Assert
    expect(payload.exp - payload.iat).toBe(900);
  });

  it('distinguishes expired tokens from invalid ones', async () => {
    // Arrange
    const expiredToken = await jwtService.signAsync(
      { sub: 'user-1' },
      { expiresIn: -10 },
    );
    const foreignToken = await new JwtService({
      secret: 'other-secret',
    }).signAsync({ sub: 'user-1' });

    // Act
    const expired = await tokenService.verifyAccessToken(expiredToken);
    const invalid = await tokenService.verifyAccessToken(foreignToken);
    const garbage = await tokenService.verifyAccessToken('not-a-jwt');

    // Assert
    expect(expired).toEqual({ status: 'expired' });
    expect(invalid).toEqual({ status: 'invalid' });
    expect(garbage).toEqual({ status: 'invalid' });
  });

  it('generates unique URL-safe refresh tokens with a stable SHA-256 hash', () => {
    // Act
    const first = tokenService.generateRefreshToken();
    const second = tokenService.generateRefreshToken();

    // Assert
    expect(first).not.toBe(second);
    expect(first).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(tokenService.hashRefreshToken(first)).toBe(
      tokenService.hashRefreshToken(first),
    );
    expect(tokenService.hashRefreshToken(first)).toMatch(/^[0-9a-f]{64}$/);
  });
});
