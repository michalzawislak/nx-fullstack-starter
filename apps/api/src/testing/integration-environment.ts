/**
 * Environment of the integration tests, shared by the Vitest config (test workers) and the
 * global setup (migrations). Vitest passes `test.env` only to test workers, so the global setup
 * must receive the same values explicitly.
 */
export const integrationEnvironment = {
  NODE_ENV: 'test',
  DATABASE_URL:
    process.env['TEST_DATABASE_URL'] ??
    'postgresql://starter:starter@localhost:5432/starter_test',
  JWT_ACCESS_SECRET: 'integration-test-secret-0123456789abcdef',
  AUTH_RATE_LIMIT_PER_MINUTE: '1000',
  MIN_APP_VERSION_IOS: '2.0.0',
} as const;

const TEST_DATABASE_SUFFIX = '_test';

/** The tests truncate tables, so they refuse to run against a database whose name does not end with _test. */
export function assertTestDatabase(databaseUrl: string): string {
  const databaseName = new URL(databaseUrl).pathname.replace(/^\//, '');

  if (!databaseName.endsWith(TEST_DATABASE_SUFFIX)) {
    throw new Error(
      `Integration tests must use a database whose name ends with "${TEST_DATABASE_SUFFIX}", got "${databaseName}". Set TEST_DATABASE_URL.`,
    );
  }

  return databaseName;
}
