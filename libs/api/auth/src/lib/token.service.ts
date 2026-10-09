import { createHash, randomBytes } from 'node:crypto';

import { Inject, Injectable } from '@nestjs/common';
import { JwtService, TokenExpiredError } from '@nestjs/jwt';

import { APP_CONFIG, type AppConfig } from '@starter/api/common';

export interface AccessTokenPayload {
  readonly sub: string;
}

export type AccessTokenVerification =
  | { readonly status: 'valid'; readonly userId: string }
  | { readonly status: 'expired' }
  | { readonly status: 'invalid' };

const REFRESH_TOKEN_BYTES = 32;

/** Short-lived JWT access tokens (BE-1) and opaque refresh tokens stored as hashes (BE-2). */
@Injectable()
export class TokenService {
  constructor(
    private readonly jwtService: JwtService,
    @Inject(APP_CONFIG) private readonly config: AppConfig,
  ) {}

  get accessTokenTtlSeconds(): number {
    return this.config.accessTokenTtlSeconds;
  }

  signAccessToken(userId: string): Promise<string> {
    const payload: AccessTokenPayload = { sub: userId };
    return this.jwtService.signAsync(payload, {
      expiresIn: this.config.accessTokenTtlSeconds,
    });
  }

  async verifyAccessToken(token: string): Promise<AccessTokenVerification> {
    try {
      const payload =
        await this.jwtService.verifyAsync<AccessTokenPayload>(token);
      return typeof payload.sub === 'string'
        ? { status: 'valid', userId: payload.sub }
        : { status: 'invalid' };
    } catch (error: unknown) {
      return error instanceof TokenExpiredError
        ? { status: 'expired' }
        : { status: 'invalid' };
    }
  }

  generateRefreshToken(): string {
    return randomBytes(REFRESH_TOKEN_BYTES).toString('base64url');
  }

  hashRefreshToken(refreshToken: string): string {
    return createHash('sha256').update(refreshToken).digest('hex');
  }
}
