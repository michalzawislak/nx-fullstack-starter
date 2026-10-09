import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';

import request from 'supertest';

import { PrismaService } from '@starter/api/database';

import { AppModule } from '../app/app.module';
import { configureApp } from '../app/configure-app';

export interface TestApp {
  readonly app: INestApplication;
  readonly prisma: PrismaService;
  /** HTTP client for the app. */
  http(): ReturnType<typeof request>;
  /** Removes all rows; call before each test. */
  resetDatabase(): Promise<void>;
  close(): Promise<void>;
}

/** Starts the real AppModule with the production HTTP configuration (configureApp). */
export async function createTestApp(): Promise<TestApp> {
  const moduleRef = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();
  const app = moduleRef.createNestApplication({ logger: false });
  configureApp(app);
  await app.init();
  const prisma = app.get(PrismaService);

  return {
    app,
    prisma,
    http: () => request(app.getHttpServer()),
    resetDatabase: async () => {
      await prisma.$executeRaw`TRUNCATE TABLE "refresh_tokens", "users" CASCADE`;
    },
    close: () => app.close(),
  };
}

/** Value of a cookie from Set-Cookie headers, with its attributes. */
export function findCookie(
  setCookieHeader: string[] | string | undefined,
  name: string,
): string | undefined {
  const cookies = Array.isArray(setCookieHeader)
    ? setCookieHeader
    : setCookieHeader
      ? [setCookieHeader]
      : [];
  return cookies.find((cookie) => cookie.startsWith(`${name}=`));
}
