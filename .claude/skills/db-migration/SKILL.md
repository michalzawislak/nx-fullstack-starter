---
name: db-migration
description: Change the PostgreSQL schema with Prisma - edit schema.prisma, create and review the migration, regenerate the client and update the seed. Use for any new table, column, index or relation.
---

# Change the database schema

Every schema change is a migration committed to the repository (BE-9). Prisma 7 configuration: `libs/api/database/prisma.config.ts`; schema: `libs/api/database/prisma/schema.prisma`.

## Steps

1. Start the database: `npm run db:up` (Docker; `.env` copied from `.env.example`).
2. Edit `schema.prisma`. Conventions used by the existing models:
   - model names in PascalCase, tables in snake_case plural via `@@map("...")`, columns in snake_case via `@map("...")`;
   - ids `String @id @default(uuid()) @db.Uuid`, timestamps `@db.Timestamptz(3)`, `createdAt @default(now())`, `updatedAt @updatedAt`;
   - an index (`@@index`) on every foreign key column; `onDelete` stated explicitly on relations.
3. Create the migration with a descriptive name:

   ```sh
   npm run db:migrate -- --name add_notes
   ```

   This writes `prisma/migrations/<timestamp>_add_notes/migration.sql` and applies it. Prisma 7 does not regenerate the client or run the seed here, so continue with `npm run db:generate`.

4. Read the generated SQL. Check especially: dropped columns or tables (data loss), new `NOT NULL` columns on existing tables (they need a default or a data migration), and renames that Prisma produced as drop + add.
5. If a breaking change must stay compatible with installed mobile apps, split it: add the new structure first, migrate data, remove the old structure in a later release (CON-4, CON-5).
6. Update `prisma/seed.ts` if the test account needs the new data, then `npm run db:seed`.
7. Use the new models only through `PrismaService` from `@starter/api/database`. Export new model types from `libs/api/database/src/index.ts` if other libraries need them.

## Rules

- Never edit a migration that is already committed; create a new one.
- Never use `prisma db push` outside throwaway local experiments.
- The generated client (`libs/api/database/src/generated`) is not committed; `npm install` and the Nx targets regenerate it (`npm run db:generate`).
- Production applies migrations with `npm run db:deploy`.

## Verify

```sh
npm run db:migrate          # must report that the schema is in sync (no new migration)
npx nx affected -t lint test build
npm run test:integration    # applies migrations to the test database first
```
