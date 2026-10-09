/**
 * Creates the test account (BE-11). Run with `npm run db:seed` after `npm run db:migrate`.
 * Credentials: SEED_USER_EMAIL / SEED_USER_PASSWORD, defaults below. Never run against production.
 */
import { hash } from '@node-rs/argon2';
import { PrismaPg } from '@prisma/adapter-pg';

import { PrismaClient } from '../src/generated/prisma/client';

const email = process.env['SEED_USER_EMAIL'] ?? 'demo@example.com';
const password = process.env['SEED_USER_PASSWORD'] ?? 'starter-password';
const databaseUrl = process.env['DATABASE_URL'];

async function seed(): Promise<void> {
  if (!databaseUrl) {
    throw new Error('DATABASE_URL is not set. Copy .env.example to .env.');
  }

  if (process.env['NODE_ENV'] === 'production') {
    throw new Error('The seed script must not run in production.');
  }

  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString: databaseUrl }),
  });

  try {
    const passwordHash = await hash(password);
    await prisma.user.upsert({
      where: { email },
      update: { passwordHash },
      create: { email, passwordHash },
    });
    console.log(`Seeded test account ${email}`);
  } finally {
    await prisma.$disconnect();
  }
}

seed().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
