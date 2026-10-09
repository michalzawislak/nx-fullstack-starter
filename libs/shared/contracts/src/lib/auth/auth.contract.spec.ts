import { PASSWORD_MAX_LENGTH } from './credentials';
import { loginRequestSchema } from './login.contract';
import { refreshRequestSchema } from './refresh.contract';
import { registerRequestSchema } from './register.contract';
import { tokenPairSchema } from './token-pair.contract';

describe('registerRequestSchema', () => {
  it('accepts a valid request and normalises the email', () => {
    // Act
    const request = registerRequestSchema.parse({
      email: 'Jane@Example.com',
      password: 'correct-horse',
    });

    // Assert
    expect(request).toEqual({
      email: 'jane@example.com',
      password: 'correct-horse',
    });
  });

  it('reports each invalid field by path', () => {
    // Act
    const result = registerRequestSchema.safeParse({
      email: 'nope',
      password: 'short',
    });

    // Assert
    expect(result.success).toBe(false);
    expect(
      result.error?.issues.map((issue) => issue.path.join('.')).sort(),
    ).toEqual(['email', 'password']);
  });
});

describe('loginRequestSchema', () => {
  it('accepts a password shorter than the rule for new passwords', () => {
    // Act
    const result = loginRequestSchema.safeParse({
      email: 'jane@example.com',
      password: 'old',
    });

    // Assert
    expect(result.success).toBe(true);
  });

  it.each([
    ['an empty password', ''],
    ['a password over the maximum length', 'a'.repeat(PASSWORD_MAX_LENGTH + 1)],
  ])('rejects %s', (_case, password) => {
    // Act
    const result = loginRequestSchema.safeParse({
      email: 'jane@example.com',
      password,
    });

    // Assert
    expect(result.success).toBe(false);
  });
});

describe('refreshRequestSchema', () => {
  it.each([
    ['a native request with a token', { refreshToken: 'opaque-token' }, true],
    ['a web request without a body token', {}, true],
    ['an empty token', { refreshToken: '' }, false],
  ] as const)('handles %s', (_case, body, expected) => {
    // Act
    const result = refreshRequestSchema.safeParse(body);

    // Assert
    expect(result.success).toBe(expected);
  });
});

describe('tokenPairSchema', () => {
  it('accepts a pair without a refresh token (web)', () => {
    // Act
    const result = tokenPairSchema.safeParse({
      accessToken: 'jwt',
      expiresIn: 900,
    });

    // Assert
    expect(result.success).toBe(true);
  });

  it.each([
    ['a non-positive lifetime', { accessToken: 'jwt', expiresIn: 0 }],
    ['a fractional lifetime', { accessToken: 'jwt', expiresIn: 1.5 }],
    ['an empty access token', { accessToken: '', expiresIn: 900 }],
  ])('rejects %s', (_case, body) => {
    // Act
    const result = tokenPairSchema.safeParse(body);

    // Assert
    expect(result.success).toBe(false);
  });
});
