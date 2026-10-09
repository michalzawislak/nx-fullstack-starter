import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

import { defineConfig } from 'prisma/config';

// The npm scripts (db:*) run the Prisma CLI from the workspace root, where .env lives.
const workspaceEnvFile = resolve(process.cwd(), '.env');

if (existsSync(workspaceEnvFile)) {
  process.loadEnvFile(workspaceEnvFile);
}

/** Prisma CLI configuration (Prisma 7). Paths are relative to this file. */
export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'tsx libs/api/database/prisma/seed.ts',
  },
  datasource: {
    url: process.env['DATABASE_URL'] ?? '',
  },
});
