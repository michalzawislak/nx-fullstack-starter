import {
  API_PATHS,
  appConfigSchema,
  healthStatusSchema,
} from '@starter/shared/contracts';

import { createTestApp, type TestApp } from '../testing/test-app';

describe('App endpoints (integration)', () => {
  let testApp: TestApp;

  beforeAll(async () => {
    testApp = await createTestApp();
  });

  afterAll(async () => {
    await testApp.close();
  });

  it('reports a healthy API and database', async () => {
    // Act
    const response = await testApp.http().get(API_PATHS.health);

    // Assert
    expect(response.status).toBe(200);
    expect(healthStatusSchema.parse(response.body)).toMatchObject({
      status: 'ok',
      database: 'up',
    });
  });

  it('publishes the minimum supported versions', async () => {
    // Act
    const response = await testApp.http().get(API_PATHS.app.config);

    // Assert
    expect(response.status).toBe(200);
    expect(
      appConfigSchema.parse(response.body).minimumSupportedVersions.ios,
    ).toBe('2.0.0');
  });

  it('answers APP_VERSION_UNSUPPORTED (426) to an outdated app (CON-6, MOB-11)', async () => {
    // Act
    const response = await testApp
      .http()
      .get(API_PATHS.app.config)
      .set({ 'X-App-Platform': 'ios', 'X-App-Version': '1.9.0' });

    // Assert
    expect(response.status).toBe(426);
    expect(response.body).toMatchObject({
      errorCode: 'APP_VERSION_UNSUPPORTED',
    });
  });

  it('answers NOT_FOUND in the ApiError shape for unknown routes', async () => {
    // Act
    const response = await testApp.http().get('/v1/does-not-exist');

    // Assert
    expect(response.status).toBe(404);
    expect(response.body).toMatchObject({
      statusCode: 404,
      errorCode: 'NOT_FOUND',
    });
  });

  it('sends security headers and a request id', async () => {
    // Act
    const response = await testApp.http().get(API_PATHS.health);

    // Assert
    expect(response.headers['x-content-type-options']).toBe('nosniff');
    expect(response.headers['x-request-id']).toEqual(expect.any(String));
  });

  it('allows credentialed CORS only for configured origins (BE-14)', async () => {
    // Act
    const allowed = await testApp
      .http()
      .get(API_PATHS.health)
      .set('Origin', 'capacitor://localhost');
    const blocked = await testApp
      .http()
      .get(API_PATHS.health)
      .set('Origin', 'https://evil.example');

    // Assert
    expect(allowed.headers['access-control-allow-origin']).toBe(
      'capacitor://localhost',
    );
    expect(allowed.headers['access-control-allow-credentials']).toBe('true');
    expect(blocked.headers['access-control-allow-origin']).toBeUndefined();
  });

  it('serves the OpenAPI document outside production (BE-15)', async () => {
    // Act
    const response = await testApp.http().get('/docs-json');

    // Assert
    expect(response.status).toBe(200);
    expect(Object.keys(response.body.paths)).toContain(API_PATHS.auth.login);
  });
});
