import { execSync } from 'node:child_process';
import { resolve } from 'node:path';

import {
  assertTestDatabase,
  integrationEnvironment,
} from './integration-environment';

const workspaceRoot = resolve(import.meta.dirname, '../../../..');

/** Applies migrations to the test database once before the integration tests (BE-9). */
export default function setup(): void {
  const databaseName = assertTestDatabase(integrationEnvironment.DATABASE_URL);

  if (process.env['SKIP_DB_MIGRATE'] === 'true') {
    return;
  }

  console.log(`Applying migrations to the test database "${databaseName}"`);
  execSync(
    'npx prisma migrate deploy --config libs/api/database/prisma.config.ts',
    {
      cwd: workspaceRoot,
      stdio: 'inherit',
      // Explicit test values win over .env, which prisma.config.ts loads without overriding.
      env: { ...process.env, ...integrationEnvironment },
    },
  );
}
