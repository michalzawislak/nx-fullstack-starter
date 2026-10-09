import { JwtService } from '@nestjs/jwt';

import type { AppConfig } from '@starter/api/common';

import { RefreshTokenService } from './refresh-token.service';
import { createInMemoryRefreshTokens } from './testing/in-memory-refresh-tokens';
import { TokenService } from './token.service';

const config = {
  refreshTokenTtlDays: 30,
  accessTokenTtlSeconds: 900,
} as AppConfig;

function setup() {
  const { prisma, tokens } = createInMemoryRefreshTokens();
  const tokenService = new TokenService(
    new JwtService({ secret: 'test-secret' }),
    config,
  );
  const service = new RefreshTokenService(prisma, tokenService, config);
  return { service, tokens, tokenService };
}

describe('RefreshTokenService', () => {
  it('stores only the hash of an issued token', async () => {
    // Arrange
    const { service, tokens, tokenService } = setup();

    // Act
    const issued = await service.issue('user-1', 'ios');

    // Assert
    expect(tokens).toHaveLength(1);
    expect(tokens[0]?.tokenHash).toBe(
      tokenService.hashRefreshToken(issued.refreshToken),
    );
    expect(tokens[0]?.tokenHash).not.toContain(issued.refreshToken);
  });

  it('rotates a token within the same family and revokes the old one', async () => {
    // Arrange
    const { service, tokens } = setup();
    const issued = await service.issue('user-1', 'ios');

    // Act
    const rotated = await service.rotate(issued.refreshToken, 'ios');

    // Assert
    expect(rotated.refreshToken).not.toBe(issued.refreshToken);
    expect(rotated.userId).toBe('user-1');
    expect(tokens).toHaveLength(2);
    expect(tokens[0]?.revokedAt).toBeInstanceOf(Date);
    expect(tokens[1]?.familyId).toBe(tokens[0]?.familyId);
  });

  it('revokes the whole family when a rotated token is used again (BE-3)', async () => {
    // Arrange
    const { service, tokens } = setup();
    const issued = await service.issue('user-1', 'ios');
    const rotated = await service.rotate(issued.refreshToken, 'ios');

    // Act
    const reuse = service.rotate(issued.refreshToken, 'ios');

    // Assert
    await expect(reuse).rejects.toMatchObject({
      errorCode: 'REFRESH_TOKEN_INVALID',
    });
    expect(tokens.every((token) => token.revokedAt !== null)).toBe(true);
    await expect(
      service.rotate(rotated.refreshToken, 'ios'),
    ).rejects.toMatchObject({
      errorCode: 'REFRESH_TOKEN_INVALID',
    });
  });

  it('rejects unknown and expired tokens', async () => {
    // Arrange
    const { service, tokens } = setup();
    const issued = await service.issue('user-1', 'web');
    const [storedToken] = tokens;
    if (storedToken) {
      storedToken.expiresAt = new Date(Date.now() - 1);
    }

    // Act & Assert
    await expect(service.rotate('unknown', 'web')).rejects.toMatchObject({
      errorCode: 'REFRESH_TOKEN_INVALID',
    });
    await expect(
      service.rotate(issued.refreshToken, 'web'),
    ).rejects.toMatchObject({
      errorCode: 'REFRESH_TOKEN_INVALID',
    });
  });

  it('revokes a token on logout only for its owner', async () => {
    // Arrange
    const { service, tokens } = setup();
    const issued = await service.issue('user-1', 'android');

    // Act
    await service.revoke(issued.refreshToken, 'someone-else');
    const revokedByOther = tokens[0]?.revokedAt;
    await service.revoke(issued.refreshToken, 'user-1');

    // Assert
    expect(revokedByOther).toBeNull();
    expect(tokens[0]?.revokedAt).toBeInstanceOf(Date);
  });
});
