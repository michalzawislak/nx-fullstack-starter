import {
  createParamDecorator,
  type ExecutionContext,
  InternalServerErrorException,
} from '@nestjs/common';

import type { Request } from 'express';

/** User identity attached to the request by the access-token guard. */
export interface AuthenticatedUser {
  readonly userId: string;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
}

export function getAuthenticatedUser(
  request: AuthenticatedRequest,
): AuthenticatedUser {
  if (!request.user) {
    throw new InternalServerErrorException(
      'CurrentUser used on a route without authentication',
    );
  }

  return request.user;
}

/** Injects the authenticated user into a controller method parameter. */
export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): AuthenticatedUser =>
    getAuthenticatedUser(
      context.switchToHttp().getRequest<AuthenticatedRequest>(),
    ),
);
