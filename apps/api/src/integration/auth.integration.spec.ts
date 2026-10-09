import { JwtService } from '@nestjs/jwt';

import {
  API_PATHS,
  REFRESH_TOKEN_COOKIE,
  tokenPairSchema,
} from '@starter/shared/contracts';

import { createTestApp, findCookie, type TestApp } from '../testing/test-app';

const credentials = { email: 'jane@example.com', password: 'correct-horse' };
const native = { 'X-App-Platform': 'ios', 'X-App-Version': '2.0.0' };
const web = { 'X-App-Platform': 'web' };

describe('Auth flows (integration)', () => {
  let testApp: TestApp;

  beforeAll(async () => {
    testApp = await createTestApp();
  });

  beforeEach(async () => {
    await testApp.resetDatabase();
  });

  afterAll(async () => {
    await testApp.close();
  });

  const register = (
    headers: Record<string, string>,
    body: object = credentials,
  ) => testApp.http().post(API_PATHS.auth.register).set(headers).send(body);

  describe('register', () => {
    it('returns a token pair with the refresh token in the body for native apps', async () => {
      // Act
      const response = await register(native);

      // Assert
      expect(response.status).toBe(201);
      expect(tokenPairSchema.parse(response.body).refreshToken).toEqual(
        expect.any(String),
      );
      expect(
        findCookie(response.headers['set-cookie'], REFRESH_TOKEN_COOKIE.name),
      ).toBeUndefined();
    });

    it('sets an httpOnly, Secure, SameSite=Strict cookie limited to /v1/auth for the web (BE-4)', async () => {
      // Act
      const response = await register(web);

      // Assert
      expect(response.status).toBe(201);
      expect(response.body.refreshToken).toBeUndefined();
      const cookie = findCookie(
        response.headers['set-cookie'],
        REFRESH_TOKEN_COOKIE.name,
      );
      expect(cookie).toMatch(/HttpOnly/);
      expect(cookie).toMatch(/Secure/);
      expect(cookie).toMatch(/SameSite=Strict/);
      expect(cookie).toMatch(/Path=\/v1\/auth/);
    });

    it('stores the email normalised and the password only as an Argon2id hash', async () => {
      // Act
      await register(native, {
        email: '  Jane@Example.COM ',
        password: credentials.password,
      });

      // Assert
      const user = await testApp.prisma.user.findUniqueOrThrow({
        where: { email: credentials.email },
      });
      expect(user.passwordHash).toMatch(/^\$argon2id\$/);
    });

    it('rejects a second account with the same email with EMAIL_TAKEN', async () => {
      // Arrange
      await register(native);

      // Act
      const response = await register(native);

      // Assert
      expect(response.status).toBe(409);
      expect(response.body).toMatchObject({ errorCode: 'EMAIL_TAKEN' });
    });

    it('returns VALIDATION_FAILED with field details for invalid input', async () => {
      // Act
      const response = await register(native, {
        email: 'nope',
        password: 'short',
      });

      // Assert
      expect(response.status).toBe(400);
      expect(response.body).toMatchObject({ errorCode: 'VALIDATION_FAILED' });
      expect(Object.keys(response.body.details).sort()).toEqual([
        'email',
        'password',
      ]);
    });
  });

  describe('login', () => {
    it('signs in with the right password', async () => {
      // Arrange
      await register(native);

      // Act
      const response = await testApp
        .http()
        .post(API_PATHS.auth.login)
        .set(native)
        .send(credentials);

      // Assert
      expect(response.status).toBe(200);
      expect(tokenPairSchema.safeParse(response.body).success).toBe(true);
    });

    it.each([
      [
        'a wrong password',
        { email: credentials.email, password: 'battery-staple' },
      ],
      [
        'an unknown email',
        { email: 'nobody@example.com', password: credentials.password },
      ],
    ])('answers INVALID_CREDENTIALS for %s', async (_case, body) => {
      // Arrange
      await register(native);

      // Act
      const response = await testApp
        .http()
        .post(API_PATHS.auth.login)
        .set(native)
        .send(body);

      // Assert
      expect(response.status).toBe(401);
      expect(response.body).toMatchObject({ errorCode: 'INVALID_CREDENTIALS' });
    });
  });

  describe('protected routes', () => {
    it('returns the current user for a valid access token', async () => {
      // Arrange
      const { body } = await register(native);

      // Act
      const response = await testApp
        .http()
        .get(API_PATHS.users.me)
        .set('Authorization', `Bearer ${body.accessToken}`);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        id: expect.any(String),
        email: credentials.email,
        createdAt: expect.any(String),
      });
    });

    it('answers UNAUTHENTICATED without a token', async () => {
      // Act
      const response = await testApp.http().get(API_PATHS.users.me);

      // Assert
      expect(response.status).toBe(401);
      expect(response.body).toMatchObject({ errorCode: 'UNAUTHENTICATED' });
    });

    it('answers TOKEN_EXPIRED for an expired access token, so the client refreshes', async () => {
      // Arrange
      const user = await testApp.prisma.user.create({
        data: { email: credentials.email, passwordHash: 'x' },
      });
      const expiredToken = await testApp.app
        .get(JwtService)
        .signAsync({ sub: user.id }, { expiresIn: -10 });

      // Act
      const response = await testApp
        .http()
        .get(API_PATHS.users.me)
        .set('Authorization', `Bearer ${expiredToken}`);

      // Assert
      expect(response.status).toBe(401);
      expect(response.body).toMatchObject({ errorCode: 'TOKEN_EXPIRED' });
    });
  });

  describe('refresh', () => {
    it('rotates the refresh token for native apps', async () => {
      // Arrange
      const { body: session } = await register(native);

      // Act
      const response = await testApp
        .http()
        .post(API_PATHS.auth.refresh)
        .set(native)
        .send({ refreshToken: session.refreshToken });

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.refreshToken).toEqual(expect.any(String));
      expect(response.body.refreshToken).not.toBe(session.refreshToken);
    });

    it('revokes the whole family when a rotated token is used again (BE-3)', async () => {
      // Arrange
      const { body: session } = await register(native);
      const { body: rotated } = await testApp
        .http()
        .post(API_PATHS.auth.refresh)
        .set(native)
        .send({ refreshToken: session.refreshToken });

      // Act
      const reuse = await testApp
        .http()
        .post(API_PATHS.auth.refresh)
        .set(native)
        .send({ refreshToken: session.refreshToken });
      const afterReuse = await testApp
        .http()
        .post(API_PATHS.auth.refresh)
        .set(native)
        .send({ refreshToken: rotated.refreshToken });

      // Assert
      expect(reuse.status).toBe(401);
      expect(reuse.body).toMatchObject({ errorCode: 'REFRESH_TOKEN_INVALID' });
      expect(afterReuse.status).toBe(401);
      expect(afterReuse.body).toMatchObject({
        errorCode: 'REFRESH_TOKEN_INVALID',
      });
    });

    it('rotates the cookie for the web', async () => {
      // Arrange
      const agent = testApp.http();
      const registration = await register(web);
      const cookie =
        findCookie(
          registration.headers['set-cookie'],
          REFRESH_TOKEN_COOKIE.name,
        ) ?? '';

      // Act
      const response = await agent
        .post(API_PATHS.auth.refresh)
        .set(web)
        .set('Cookie', cookie.split(';')[0] ?? '')
        .send({});

      // Assert
      expect(response.status).toBe(200);
      const rotatedCookie = findCookie(
        response.headers['set-cookie'],
        REFRESH_TOKEN_COOKIE.name,
      );
      expect(rotatedCookie).toBeDefined();
      expect(rotatedCookie?.split(';')[0]).not.toBe(cookie.split(';')[0]);
    });

    it('answers REFRESH_TOKEN_INVALID when no token is sent', async () => {
      // Act
      const response = await testApp
        .http()
        .post(API_PATHS.auth.refresh)
        .set(web)
        .send({});

      // Assert
      expect(response.status).toBe(401);
      expect(response.body).toMatchObject({
        errorCode: 'REFRESH_TOKEN_INVALID',
      });
    });
  });

  describe('logout', () => {
    it('invalidates the current refresh token', async () => {
      // Arrange
      const { body: session } = await register(native);

      // Act
      const logout = await testApp
        .http()
        .post(API_PATHS.auth.logout)
        .set(native)
        .set('Authorization', `Bearer ${session.accessToken}`)
        .send({ refreshToken: session.refreshToken });
      const refresh = await testApp
        .http()
        .post(API_PATHS.auth.refresh)
        .set(native)
        .send({ refreshToken: session.refreshToken });

      // Assert
      expect(logout.status).toBe(204);
      expect(refresh.status).toBe(401);
    });

    it('clears the cookie for the web', async () => {
      // Arrange
      const registration = await register(web);
      const cookie =
        (
          findCookie(
            registration.headers['set-cookie'],
            REFRESH_TOKEN_COOKIE.name,
          ) ?? ''
        ).split(';')[0] ?? '';

      // Act
      const response = await testApp
        .http()
        .post(API_PATHS.auth.logout)
        .set(web)
        .set('Cookie', cookie)
        .set('Authorization', `Bearer ${registration.body.accessToken}`)
        .send({});

      // Assert
      expect(response.status).toBe(204);
      expect(
        findCookie(response.headers['set-cookie'], REFRESH_TOKEN_COOKIE.name),
      ).toMatch(/Expires=Thu, 01 Jan 1970/);
    });

    it('requires an access token', async () => {
      // Act
      const response = await testApp
        .http()
        .post(API_PATHS.auth.logout)
        .set(native)
        .send({});

      // Assert
      expect(response.status).toBe(401);
    });
  });
});
