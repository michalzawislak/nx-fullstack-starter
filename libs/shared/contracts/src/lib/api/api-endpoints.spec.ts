import type { LoginRequest } from '../auth/login.contract';
import type { TokenPair } from '../auth/token-pair.contract';
import type { User } from '../users/user.contract';
import { API_ENDPOINTS } from './api-endpoints';
import type {
  EndpointContract,
  EndpointRequest,
  EndpointResponse,
} from './endpoint';

const flattenEndpoints = (): EndpointContract[] => [
  ...Object.values(API_ENDPOINTS.auth),
  ...Object.values(API_ENDPOINTS.users),
  ...Object.values(API_ENDPOINTS.app),
  API_ENDPOINTS.health,
];

describe('API_ENDPOINTS', () => {
  it('matches the endpoint table in PRD section 7.1', () => {
    // Arrange
    const expectedTable = [
      'POST /v1/auth/register public',
      'POST /v1/auth/login public',
      'POST /v1/auth/refresh refresh-token',
      'POST /v1/auth/logout user',
      'GET /v1/users/me user',
      'GET /v1/app/config public',
      'GET /health public',
    ];

    // Act
    const actualTable = flattenEndpoints().map(
      ({ method, path, access }) => `${method} ${path} ${access}`,
    );

    // Assert
    expect(actualTable).toEqual(expectedTable);
  });

  it('defines a body schema for every POST request and none for GET requests', () => {
    // Act
    const endpoints = flattenEndpoints();

    // Assert
    expect(
      endpoints
        .filter(({ method }) => method === 'POST')
        .every(({ request }) => request !== null),
    ).toBe(true);
    expect(
      endpoints
        .filter(({ method }) => method === 'GET')
        .every(({ request }) => request === null),
    ).toBe(true);
  });

  it('derives request and response types from the schemas', () => {
    // Assert (compile-time)
    expectTypeOf<
      EndpointRequest<typeof API_ENDPOINTS.auth.login>
    >().toEqualTypeOf<LoginRequest>();
    expectTypeOf<
      EndpointResponse<typeof API_ENDPOINTS.auth.login>
    >().toEqualTypeOf<TokenPair>();
    expectTypeOf<
      EndpointRequest<typeof API_ENDPOINTS.users.me>
    >().toEqualTypeOf<void>();
    expectTypeOf<
      EndpointResponse<typeof API_ENDPOINTS.users.me>
    >().toEqualTypeOf<User>();
    expectTypeOf<
      EndpointResponse<typeof API_ENDPOINTS.auth.logout>
    >().toEqualTypeOf<void>();
  });
});
