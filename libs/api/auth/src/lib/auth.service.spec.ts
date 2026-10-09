import type { UsersService } from '@starter/api/users';

import { AuthService } from './auth.service';
import type { PasswordHasherService } from './password-hasher.service';
import type { RefreshTokenService } from './refresh-token.service';
import type { TokenService } from './token.service';

const user = { id: 'user-1', email: 'jane@example.com', passwordHash: 'hash' };

function setup({
  isPasswordValid = true,
  existingUser = user as typeof user | null,
} = {}) {
  const usersService = {
    create: vi.fn(async () => user),
    findByEmail: vi.fn(async () => existingUser),
  } as unknown as UsersService;
  const passwordHasher = {
    hash: vi.fn(async () => 'new-hash'),
    verify: vi.fn(async () => isPasswordValid),
  } as unknown as PasswordHasherService;
  const tokenService = {
    signAccessToken: vi.fn(async () => 'access-token'),
    accessTokenTtlSeconds: 900,
  } as unknown as TokenService;
  const refreshTokenService = {
    issue: vi.fn(async () => ({ userId: 'user-1', refreshToken: 'refresh-1' })),
    rotate: vi.fn(async () => ({
      userId: 'user-1',
      refreshToken: 'refresh-2',
    })),
    revoke: vi.fn(async () => undefined),
  } as unknown as RefreshTokenService;
  const authService = new AuthService(
    usersService,
    passwordHasher,
    tokenService,
    refreshTokenService,
  );
  return { authService, usersService, passwordHasher, refreshTokenService };
}

describe('AuthService', () => {
  it('registers with a hashed password and starts a session', async () => {
    // Arrange
    const { authService, usersService, refreshTokenService } = setup();

    // Act
    const session = await authService.register(
      { email: user.email, password: 'correct-horse' },
      'ios',
    );

    // Assert
    expect(usersService.create).toHaveBeenCalledWith({
      email: user.email,
      passwordHash: 'new-hash',
    });
    expect(refreshTokenService.issue).toHaveBeenCalledWith('user-1', 'ios');
    expect(session).toEqual({
      accessToken: 'access-token',
      refreshToken: 'refresh-1',
      expiresIn: 900,
    });
  });

  it('logs in when the password matches', async () => {
    // Arrange
    const { authService } = setup();

    // Act
    const session = await authService.login(
      { email: user.email, password: 'correct-horse' },
      'web',
    );

    // Assert
    expect(session.accessToken).toBe('access-token');
  });

  it.each([
    ['a wrong password', { isPasswordValid: false }],
    ['an unknown email', { existingUser: null, isPasswordValid: false }],
  ])(
    'rejects %s with INVALID_CREDENTIALS and still verifies a hash',
    async (_case, options) => {
      // Arrange
      const { authService, passwordHasher } = setup(options);

      // Act
      const result = authService.login(
        { email: user.email, password: 'x' },
        'web',
      );

      // Assert
      await expect(result).rejects.toMatchObject({
        errorCode: 'INVALID_CREDENTIALS',
      });
      expect(passwordHasher.verify).toHaveBeenCalledTimes(1);
    },
  );

  it('refreshes with a rotated token and revokes on logout', async () => {
    // Arrange
    const { authService, refreshTokenService } = setup();

    // Act
    const session = await authService.refresh('refresh-1', 'android');
    await authService.logout('refresh-2', 'user-1');

    // Assert
    expect(session.refreshToken).toBe('refresh-2');
    expect(refreshTokenService.revoke).toHaveBeenCalledWith(
      'refresh-2',
      'user-1',
    );
  });
});
