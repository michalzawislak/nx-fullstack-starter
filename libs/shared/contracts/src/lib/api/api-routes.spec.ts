import { API_PATHS, API_VERSION, REFRESH_TOKEN_COOKIE } from './api-routes';

describe('API_PATHS', () => {
  it('prefixes business routes with the API version', () => {
    // Arrange
    const versionPrefix = `/v${API_VERSION}/`;

    // Act
    const versionedPaths = [
      ...Object.values(API_PATHS.auth),
      ...Object.values(API_PATHS.users),
      ...Object.values(API_PATHS.app),
    ];

    // Assert
    expect(versionedPaths.every((path) => path.startsWith(versionPrefix))).toBe(
      true,
    );
  });

  it('builds the paths listed in PRD section 7.1', () => {
    // Arrange & Act
    const paths = API_PATHS;

    // Assert
    expect(paths).toEqual({
      auth: {
        register: '/v1/auth/register',
        login: '/v1/auth/login',
        refresh: '/v1/auth/refresh',
        logout: '/v1/auth/logout',
      },
      users: { me: '/v1/users/me' },
      app: { config: '/v1/app/config' },
      health: '/health',
    });
  });

  it('limits the refresh-token cookie to the auth routes', () => {
    // Arrange & Act
    const cookiePath = REFRESH_TOKEN_COOKIE.path;

    // Assert
    expect(API_PATHS.auth.refresh.startsWith(cookiePath)).toBe(true);
    expect(API_PATHS.users.me.startsWith(cookiePath)).toBe(false);
  });
});
