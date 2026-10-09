import type { Request, Response } from 'express';

import type { AppConfig } from '@starter/api/common';

import { AuthController } from './auth.controller';
import type { AuthService } from './auth.service';

const session = {
  accessToken: 'access',
  refreshToken: 'refresh',
  expiresIn: 900,
};
const config = { refreshTokenTtlDays: 30 } as AppConfig;

function setup(
  overrides: Partial<Record<keyof AuthService, ReturnType<typeof vi.fn>>> = {},
) {
  const authService = {
    register: vi.fn(async () => session),
    login: vi.fn(async () => session),
    refresh: vi.fn(async () => session),
    logout: vi.fn(async () => undefined),
    ...overrides,
  } as unknown as AuthService;
  const response = {
    cookie: vi.fn(),
    clearCookie: vi.fn(),
  } as unknown as Response;
  const request = (platform: string, cookies: Record<string, string> = {}) =>
    ({
      header: (name: string) =>
        name === 'X-App-Platform' ? platform : undefined,
      cookies,
    }) as unknown as Request;
  return {
    controller: new AuthController(authService, config),
    authService,
    response,
    request,
  };
}

describe('AuthController', () => {
  it('passes the resolved platform to register and login', async () => {
    // Arrange
    const { controller, authService, response, request } = setup();
    const body = { email: 'jane@example.com', password: 'correct-horse' };

    // Act
    await controller.register(body, request('ios'), response);
    await controller.login(body, request('android'), response);

    // Assert
    expect(authService.register).toHaveBeenCalledWith(body, 'ios');
    expect(authService.login).toHaveBeenCalledWith(body, 'android');
  });

  it('clears the web cookie when refresh fails', async () => {
    // Arrange
    const failure = new Error('invalid');
    const { controller, response, request } = setup({
      refresh: vi.fn(async () => Promise.reject(failure)),
    });

    // Act
    const result = controller.refresh(
      {},
      request('web', { refresh_token: 'old' }),
      response,
    );

    // Assert
    await expect(result).rejects.toBe(failure);
    expect(response.clearCookie).toHaveBeenCalled();
  });

  it('logs out even without a refresh token', async () => {
    // Arrange
    const { controller, authService, response, request } = setup();

    // Act
    await controller.logout({}, { userId: 'user-1' }, request('ios'), response);

    // Assert
    expect(authService.logout).not.toHaveBeenCalled();
    expect(response.clearCookie).not.toHaveBeenCalled();
  });
});
