import type { PrismaService, RefreshToken } from '@starter/api/database';

type RefreshTokenWhere = Partial<
  Pick<RefreshToken, 'id' | 'tokenHash' | 'userId' | 'familyId'>
> & {
  revokedAt?: null;
};

const matches = (token: RefreshToken, where: RefreshTokenWhere): boolean =>
  Object.entries(where).every(
    ([key, value]) => token[key as keyof RefreshToken] === value,
  );

/** Minimal in-memory stand-in for prisma.refreshToken, enough for RefreshTokenService unit tests. */
export function createInMemoryRefreshTokens(): {
  prisma: PrismaService;
  tokens: RefreshToken[];
} {
  const tokens: RefreshToken[] = [];

  const refreshToken = {
    findUnique: async ({ where }: { where: { tokenHash: string } }) =>
      tokens.find((token) => token.tokenHash === where.tokenHash) ?? null,
    create: async ({
      data,
    }: {
      data: Omit<RefreshToken, 'id' | 'createdAt' | 'revokedAt'>;
    }) => {
      const token: RefreshToken = {
        ...data,
        id: crypto.randomUUID(),
        createdAt: new Date(),
        revokedAt: null,
      };
      tokens.push(token);
      return token;
    },
    updateMany: async ({
      where,
      data,
    }: {
      where: RefreshTokenWhere;
      data: { revokedAt: Date };
    }) => {
      const matching = tokens.filter((token) => matches(token, where));
      matching.forEach((token) => Object.assign(token, data));
      return { count: matching.length };
    },
  };

  return { prisma: { refreshToken } as unknown as PrismaService, tokens };
}
