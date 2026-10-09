import { API_PATHS } from '@starter/shared/contracts';

import { createTestApp, type TestApp } from '../testing/test-app';

describe('Auth rate limit (integration, BE-7)', () => {
  let testApp: TestApp;
  const originalLimit = process.env['AUTH_RATE_LIMIT_PER_MINUTE'];

  beforeAll(async () => {
    process.env['AUTH_RATE_LIMIT_PER_MINUTE'] = '3';
    testApp = await createTestApp();
  });

  afterAll(async () => {
    process.env['AUTH_RATE_LIMIT_PER_MINUTE'] = originalLimit;
    await testApp.close();
  });

  it('answers RATE_LIMITED after the limit is reached', async () => {
    // Arrange
    const login = () =>
      testApp
        .http()
        .post(API_PATHS.auth.login)
        .send({ email: 'jane@example.com', password: 'wrong-password' });

    // Act
    const statuses: number[] = [];
    for (let attempt = 0; attempt < 4; attempt += 1) {
      statuses.push((await login()).status);
    }
    const limited = await login();

    // Assert
    expect(statuses.slice(0, 3)).toEqual([401, 401, 401]);
    expect(limited.status).toBe(429);
    expect(limited.body).toMatchObject({ errorCode: 'RATE_LIMITED' });
  });

  it('does not limit routes outside /v1/auth', async () => {
    // Act
    const responses = await Promise.all(
      Array.from({ length: 6 }, () => testApp.http().get(API_PATHS.health)),
    );

    // Assert
    expect(responses.every((response) => response.status === 200)).toBe(true);
  });
});
