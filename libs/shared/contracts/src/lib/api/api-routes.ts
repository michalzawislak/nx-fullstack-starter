/** API version used in every versioned path (CON-4). */
export const API_VERSION = '1';

/**
 * Route segments for NestJS controllers (`@Controller(...)`, `@Post(...)`).
 * Full paths for clients are in API_PATHS (CON-3).
 */
export const API_ROUTES = {
  auth: {
    controller: 'auth',
    register: 'register',
    login: 'login',
    refresh: 'refresh',
    logout: 'logout',
  },
  users: {
    controller: 'users',
    me: 'me',
  },
  app: {
    controller: 'app',
    config: 'config',
  },
  health: {
    controller: 'health',
  },
} as const;

type VersionedPath<
  TController extends string,
  TRoute extends string,
> = `/v${typeof API_VERSION}/${TController}/${TRoute}`;

function versionedPath<TController extends string, TRoute extends string>(
  controller: TController,
  route: TRoute,
): VersionedPath<TController, TRoute> {
  return `/v${API_VERSION}/${controller}/${route}`;
}

/** Absolute paths relative to the API base URL (FE-12). */
export const API_PATHS = {
  auth: {
    register: versionedPath(
      API_ROUTES.auth.controller,
      API_ROUTES.auth.register,
    ),
    login: versionedPath(API_ROUTES.auth.controller, API_ROUTES.auth.login),
    refresh: versionedPath(API_ROUTES.auth.controller, API_ROUTES.auth.refresh),
    logout: versionedPath(API_ROUTES.auth.controller, API_ROUTES.auth.logout),
  },
  users: {
    me: versionedPath(API_ROUTES.users.controller, API_ROUTES.users.me),
  },
  app: {
    config: versionedPath(API_ROUTES.app.controller, API_ROUTES.app.config),
  },
  health: `/${API_ROUTES.health.controller}`,
} as const;

/** Web refresh-token cookie (BE-4): httpOnly, Secure, SameSite=Strict, limited to the auth routes. */
export const REFRESH_TOKEN_COOKIE = {
  name: 'refresh_token',
  path: `/v${API_VERSION}/${API_ROUTES.auth.controller}`,
} as const;
