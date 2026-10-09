import { defineConfig } from 'vitest/config';

import { integrationEnvironment } from './src/testing/integration-environment';

/**
 * Integration tests: the real AppModule over HTTP against a real PostgreSQL (PRD section 9.1).
 * Database: TEST_DATABASE_URL, by default the starter_test database from docker-compose.yml.
 * Run with `npm run test:integration`.
 */
export default defineConfig(() => ({
  root: import.meta.dirname,
  cacheDir: '../../node_modules/.vite/apps/api-integration',
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    name: 'api-integration',
    watch: false,
    globals: true,
    environment: 'node',
    include: ['src/**/*.integration.spec.ts'],
    globalSetup: ['src/testing/integration-global-setup.ts'],
    fileParallelism: false,
    testTimeout: 30_000,
    hookTimeout: 60_000,
    reporters: ['default'],
    env: { ...integrationEnvironment },
  },
}));
