import {
  type CanActivate,
  type ExecutionContext,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import {
  ApiException,
  type AuthenticatedRequest,
  IS_PUBLIC_KEY,
} from '@starter/api/common';

import { TokenService } from './token.service';

const BEARER_PREFIX = 'Bearer ';

/** Global guard: every route needs a valid access token unless marked with @Public() (BE-6). */
@Injectable()
export class AccessTokenGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly tokenService: TokenService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean | undefined>(
      IS_PUBLIC_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const authorization = request.header('authorization');

    if (!authorization?.startsWith(BEARER_PREFIX)) {
      throw new ApiException('UNAUTHENTICATED', 'Missing access token');
    }

    const verification = await this.tokenService.verifyAccessToken(
      authorization.slice(BEARER_PREFIX.length),
    );

    if (verification.status === 'expired') {
      throw new ApiException('TOKEN_EXPIRED', 'Access token expired');
    }

    if (verification.status === 'invalid') {
      throw new ApiException('UNAUTHENTICATED', 'Invalid access token');
    }

    request.user = { userId: verification.userId };
    return true;
  }
}
