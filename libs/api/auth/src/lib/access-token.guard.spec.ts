import type { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import type { AuthenticatedRequest } from '@starter/api/common';

import { AccessTokenGuard } from './access-token.guard';
import type { AccessTokenVerification, TokenService } from './token.service';

function setup(verification: AccessTokenVerification, isPublic = false) {
  const reflector = {
    getAllAndOverride: () => isPublic,
  } as unknown as Reflector;
  const tokenService = {
    verifyAccessToken: vi.fn(async () => verification),
  } as unknown as TokenService;
  const guard = new AccessTokenGuard(reflector, tokenService);
  const request = { header: vi.fn() } as unknown as AuthenticatedRequest & {
    header: ReturnType<typeof vi.fn>;
  };
  const context = {
    getHandler: () => undefined,
    getClass: () => undefined,
    switchToHttp: () => ({ getRequest: () => request }),
  } as unknown as ExecutionContext;
  return { guard, request, context, tokenService };
}

describe('AccessTokenGuard', () => {
  it('lets public routes through without a token', async () => {
    // Arrange
    const { guard, context } = setup({ status: 'invalid' }, true);

    // Act
    const canActivate = await guard.canActivate(context);

    // Assert
    expect(canActivate).toBe(true);
  });

  it('attaches the user for a valid bearer token', async () => {
    // Arrange
    const { guard, context, request } = setup({
      status: 'valid',
      userId: 'user-1',
    });
    request.header.mockReturnValue('Bearer token');

    // Act
    const canActivate = await guard.canActivate(context);

    // Assert
    expect(canActivate).toBe(true);
    expect(request.user).toEqual({ userId: 'user-1' });
  });

  it.each([
    [
      'a missing header',
      undefined,
      { status: 'valid', userId: 'x' },
      'UNAUTHENTICATED',
    ],
    [
      'a non-bearer header',
      'Basic abc',
      { status: 'valid', userId: 'x' },
      'UNAUTHENTICATED',
    ],
    [
      'an expired token',
      'Bearer token',
      { status: 'expired' },
      'TOKEN_EXPIRED',
    ],
    [
      'an invalid token',
      'Bearer token',
      { status: 'invalid' },
      'UNAUTHENTICATED',
    ],
  ] as const)('rejects %s', async (_case, header, verification, errorCode) => {
    // Arrange
    const { guard, context, request } = setup(verification);
    request.header.mockReturnValue(header);

    // Act
    const result = guard.canActivate(context);

    // Assert
    await expect(result).rejects.toMatchObject({ errorCode });
  });
});
