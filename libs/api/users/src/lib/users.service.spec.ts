import { Prisma, type PrismaService, type User } from '@starter/api/database';

import { toPublicUser, UsersService } from './users.service';

const userRecord: User = {
  id: '7b0c6f0e-3c1a-4a51-9a8e-2f0f2a7c9d11',
  email: 'jane@example.com',
  passwordHash: '$argon2id$secret',
  createdAt: new Date('2026-10-09T08:00:00.000Z'),
  updatedAt: new Date('2026-10-09T08:00:00.000Z'),
};

function setup(
  overrides: Partial<
    Record<'create' | 'findUnique', ReturnType<typeof vi.fn>>
  > = {},
) {
  const user = {
    create: vi.fn(async () => userRecord),
    findUnique: vi.fn(async () => userRecord),
    ...overrides,
  };
  return new UsersService({ user } as unknown as PrismaService);
}

describe('toPublicUser', () => {
  it('exposes id, email and creation date but never the password hash', () => {
    // Act
    const publicUser = toPublicUser(userRecord);

    // Assert
    expect(publicUser).toEqual({
      id: userRecord.id,
      email: userRecord.email,
      createdAt: '2026-10-09T08:00:00.000Z',
    });
  });
});

describe('UsersService', () => {
  it('maps a unique constraint violation to EMAIL_TAKEN', async () => {
    // Arrange
    const uniqueViolation = new Prisma.PrismaClientKnownRequestError(
      'Unique constraint failed',
      {
        code: 'P2002',
        clientVersion: 'test',
      },
    );
    const usersService = setup({
      create: vi.fn(async () => Promise.reject(uniqueViolation)),
    });

    // Act
    const result = usersService.create({
      email: userRecord.email,
      passwordHash: 'hash',
    });

    // Assert
    await expect(result).rejects.toMatchObject({ errorCode: 'EMAIL_TAKEN' });
  });

  it('rethrows other database errors', async () => {
    // Arrange
    const usersService = setup({
      create: vi.fn(async () => Promise.reject(new Error('connection lost'))),
    });

    // Act
    const result = usersService.create({
      email: userRecord.email,
      passwordHash: 'hash',
    });

    // Assert
    await expect(result).rejects.toThrow('connection lost');
  });

  it('treats a deleted account as UNAUTHENTICATED', async () => {
    // Arrange
    const usersService = setup({ findUnique: vi.fn(async () => null) });

    // Act
    const result = usersService.getById('missing');

    // Assert
    await expect(result).rejects.toMatchObject({
      errorCode: 'UNAUTHENTICATED',
    });
  });
});
