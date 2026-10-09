import { buildOpenApiDocument } from './openapi-document';

describe('buildOpenApiDocument', () => {
  const document = buildOpenApiDocument({ title: 'Starter API', version: '1' });

  it('describes every endpoint of the contract', () => {
    // Act
    const operations = Object.entries(document.paths).flatMap(
      ([path, methods]) =>
        Object.keys(methods).map((method) => `${method.toUpperCase()} ${path}`),
    );

    // Assert
    expect(operations.sort()).toEqual(
      [
        'GET /health',
        'GET /v1/app/config',
        'GET /v1/users/me',
        'POST /v1/auth/login',
        'POST /v1/auth/logout',
        'POST /v1/auth/refresh',
        'POST /v1/auth/register',
      ].sort(),
    );
  });

  it('marks user endpoints with bearer security and uses the right success status', () => {
    // Act
    const me = document.paths['/v1/users/me']?.['get'];
    const register = document.paths['/v1/auth/register']?.['post'];
    const logout = document.paths['/v1/auth/logout']?.['post'];

    // Assert
    expect(me?.security).toEqual([{ bearer: [] }]);
    expect(register?.security).toBeUndefined();
    expect(Object.keys(register?.responses ?? {})).toContain('201');
    expect(Object.keys(logout?.responses ?? {})).toContain('204');
  });

  it('includes request schemas and the shared ApiError schema', () => {
    // Act
    const loginBody = document.paths['/v1/auth/login']?.['post']?.requestBody;

    // Assert
    expect(loginBody?.content['application/json'].schema).toMatchObject({
      type: 'object',
      required: ['email', 'password'],
    });
    expect(document.components.schemas['ApiError']).toMatchObject({
      type: 'object',
    });
  });
});
