import { Injectable } from '@nestjs/common';

import { ApiException } from '@starter/api/common';
import { UsersService } from '@starter/api/users';

import type {
  AppPlatform,
  LoginRequest,
  RegisterRequest,
} from '@starter/shared/contracts';

import { PasswordHasherService } from './password-hasher.service';
import { RefreshTokenService } from './refresh-token.service';
import { TokenService } from './token.service';

/** Access token for the client plus the raw refresh token; the controller decides how to send it (BE-4). */
export interface AuthSession {
  readonly accessToken: string;
  readonly refreshToken: string;
  readonly expiresIn: number;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly passwordHasher: PasswordHasherService,
    private readonly tokenService: TokenService,
    private readonly refreshTokenService: RefreshTokenService,
  ) {}

  async register(
    request: RegisterRequest,
    platform: AppPlatform,
  ): Promise<AuthSession> {
    const passwordHash = await this.passwordHasher.hash(request.password);
    const user = await this.usersService.create({
      email: request.email,
      passwordHash,
    });
    return this.startSession(user.id, platform);
  }

  async login(
    request: LoginRequest,
    platform: AppPlatform,
  ): Promise<AuthSession> {
    const user = await this.usersService.findByEmail(request.email);
    const isPasswordValid = await this.passwordHasher.verify(
      user?.passwordHash ?? null,
      request.password,
    );

    if (!user || !isPasswordValid) {
      throw new ApiException(
        'INVALID_CREDENTIALS',
        'Email or password is incorrect',
      );
    }

    return this.startSession(user.id, platform);
  }

  async refresh(
    refreshToken: string,
    platform: AppPlatform,
  ): Promise<AuthSession> {
    const rotated = await this.refreshTokenService.rotate(
      refreshToken,
      platform,
    );
    return this.createSession(rotated.userId, rotated.refreshToken);
  }

  logout(refreshToken: string, userId: string): Promise<void> {
    return this.refreshTokenService.revoke(refreshToken, userId);
  }

  private async startSession(
    userId: string,
    platform: AppPlatform,
  ): Promise<AuthSession> {
    const issued = await this.refreshTokenService.issue(userId, platform);
    return this.createSession(userId, issued.refreshToken);
  }

  private async createSession(
    userId: string,
    refreshToken: string,
  ): Promise<AuthSession> {
    return {
      accessToken: await this.tokenService.signAccessToken(userId),
      refreshToken,
      expiresIn: this.tokenService.accessTokenTtlSeconds,
    };
  }
}
