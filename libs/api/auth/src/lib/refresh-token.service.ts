import { randomUUID } from 'node:crypto';

import { Inject, Injectable, Logger } from '@nestjs/common';

import { ApiException, APP_CONFIG, type AppConfig } from '@starter/api/common';
import { PrismaService } from '@starter/api/database';

import type { AppPlatform } from '@starter/shared/contracts';

import { TokenService } from './token.service';

const MILLISECONDS_PER_DAY = 86_400_000;

export interface IssuedRefreshToken {
  readonly userId: string;
  readonly refreshToken: string;
}

const invalidRefreshToken = (): ApiException =>
  new ApiException(
    'REFRESH_TOKEN_INVALID',
    'The session has ended. Sign in again.',
  );

/** Refresh-token lifecycle: issue, rotate with reuse detection (BE-3), revoke. */
@Injectable()
export class RefreshTokenService {
  private readonly logger = new Logger(RefreshTokenService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly tokenService: TokenService,
    @Inject(APP_CONFIG) private readonly config: AppConfig,
  ) {}

  /** Starts a new token family (login, register). */
  issue(userId: string, platform: AppPlatform): Promise<IssuedRefreshToken> {
    return this.store(userId, platform, randomUUID());
  }

  /**
   * Replaces a refresh token with a new one in the same family. Using a token that was already
   * rotated or revoked means it leaked, so the whole family is revoked.
   */
  async rotate(
    refreshToken: string,
    platform: AppPlatform,
  ): Promise<IssuedRefreshToken> {
    const tokenHash = this.tokenService.hashRefreshToken(refreshToken);
    const storedToken = await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
    });

    if (!storedToken) {
      throw invalidRefreshToken();
    }

    if (storedToken.expiresAt.getTime() <= Date.now()) {
      throw invalidRefreshToken();
    }

    // Revoke only if still active; a concurrent request that already rotated it counts as reuse.
    const { count } = await this.prisma.refreshToken.updateMany({
      where: { id: storedToken.id, revokedAt: null },
      data: { revokedAt: new Date() },
    });

    if (count === 0) {
      await this.revokeFamily(storedToken.familyId);
      this.logger.warn({
        event: 'refresh_token_reuse',
        userId: storedToken.userId,
        familyId: storedToken.familyId,
      });
      throw invalidRefreshToken();
    }

    return this.store(storedToken.userId, platform, storedToken.familyId);
  }

  /** Revokes the given token if it belongs to the user (logout). Unknown tokens are ignored. */
  async revoke(refreshToken: string, userId: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: {
        tokenHash: this.tokenService.hashRefreshToken(refreshToken),
        userId,
        revokedAt: null,
      },
      data: { revokedAt: new Date() },
    });
  }

  private async revokeFamily(familyId: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { familyId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  private async store(
    userId: string,
    platform: AppPlatform,
    familyId: string,
  ): Promise<IssuedRefreshToken> {
    const refreshToken = this.tokenService.generateRefreshToken();

    await this.prisma.refreshToken.create({
      data: {
        userId,
        familyId,
        platform,
        tokenHash: this.tokenService.hashRefreshToken(refreshToken),
        expiresAt: new Date(
          Date.now() + this.config.refreshTokenTtlDays * MILLISECONDS_PER_DAY,
        ),
      },
    });

    return { userId, refreshToken };
  }
}
