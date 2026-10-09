import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Inject,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

import type { Request, Response } from 'express';

import {
  APP_CONFIG,
  type AppConfig,
  type AuthenticatedUser,
  CurrentUser,
  Public,
  resolveAppPlatform,
  SchemaValidationPipe,
} from '@starter/api/common';

import {
  API_ROUTES,
  API_VERSION,
  type LoginRequest,
  loginRequestSchema,
  type LogoutRequest,
  logoutRequestSchema,
  type RefreshRequest,
  refreshRequestSchema,
  type RegisterRequest,
  registerRequestSchema,
  type TokenPair,
} from '@starter/shared/contracts';

import { AuthService } from './auth.service';
import {
  clearRefreshTokenCookie,
  readRefreshToken,
  sendSession,
} from './refresh-token-transport';

/** Auth endpoints (PRD section 7.1), rate limited (BE-7). */
@Controller({ path: API_ROUTES.auth.controller, version: API_VERSION })
@UseGuards(ThrottlerGuard)
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    @Inject(APP_CONFIG) private readonly config: AppConfig,
  ) {}

  @Public()
  @Post(API_ROUTES.auth.register)
  async register(
    @Body(new SchemaValidationPipe(registerRequestSchema))
    body: RegisterRequest,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<TokenPair> {
    const platform = resolveAppPlatform(request);
    const session = await this.authService.register(body, platform);
    return sendSession(
      response,
      session,
      platform,
      this.config.refreshTokenTtlDays,
    );
  }

  @Public()
  @Post(API_ROUTES.auth.login)
  @HttpCode(HttpStatus.OK)
  async login(
    @Body(new SchemaValidationPipe(loginRequestSchema)) body: LoginRequest,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<TokenPair> {
    const platform = resolveAppPlatform(request);
    const session = await this.authService.login(body, platform);
    return sendSession(
      response,
      session,
      platform,
      this.config.refreshTokenTtlDays,
    );
  }

  @Public()
  @Post(API_ROUTES.auth.refresh)
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Body(new SchemaValidationPipe(refreshRequestSchema)) body: RefreshRequest,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<TokenPair> {
    const platform = resolveAppPlatform(request);
    const refreshToken = readRefreshToken(request, body.refreshToken, platform);

    try {
      const session = await this.authService.refresh(refreshToken, platform);
      return sendSession(
        response,
        session,
        platform,
        this.config.refreshTokenTtlDays,
      );
    } catch (error: unknown) {
      if (platform === 'web') {
        clearRefreshTokenCookie(response);
      }

      throw error;
    }
  }

  @Post(API_ROUTES.auth.logout)
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(
    @Body(new SchemaValidationPipe(logoutRequestSchema)) body: LogoutRequest,
    @CurrentUser() currentUser: AuthenticatedUser,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<void> {
    const platform = resolveAppPlatform(request);

    try {
      await this.authService.logout(
        readRefreshToken(request, body.refreshToken, platform),
        currentUser.userId,
      );
    } catch {
      // Logging out without a refresh token still ends the session on the client.
    }

    if (platform === 'web') {
      clearRefreshTokenCookie(response);
    }
  }
}
