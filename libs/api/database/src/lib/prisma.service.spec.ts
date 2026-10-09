import type { AppConfig } from '@starter/api/common';

import { Prisma } from '../generated/prisma/client';
import { PrismaService } from './prisma.service';
import { isUniqueConstraintError } from './prisma-errors';

describe('isUniqueConstraintError', () => {
  it('recognises only Prisma unique constraint violations (P2002)', () => {
    // Arrange
    const uniqueViolation = new Prisma.PrismaClientKnownRequestError('Unique', {
      code: 'P2002',
      clientVersion: 'test',
    });
    const otherKnownError = new Prisma.PrismaClientKnownRequestError(
      'Missing',
      { code: 'P2025', clientVersion: 'test' },
    );

    // Act & Assert
    expect(isUniqueConstraintError(uniqueViolation)).toBe(true);
    expect(isUniqueConstraintError(otherKnownError)).toBe(false);
    expect(isUniqueConstraintError(new Error('P2002'))).toBe(false);
  });
});

describe('PrismaService', () => {
  it('reports an unreachable database as unhealthy instead of throwing', async () => {
    // Arrange
    const config = {
      databaseUrl: 'postgresql://nobody:nothing@127.0.0.1:1/none',
    } as AppConfig;
    const prismaService = new PrismaService(config);

    // Act
    const isHealthy = await prismaService.isHealthy();

    // Assert
    expect(isHealthy).toBe(false);
    await prismaService.onModuleDestroy();
  });

  it('reports a database that answers SELECT 1 as healthy', async () => {
    // Arrange
    const prismaService = new PrismaService({
      databaseUrl: 'postgresql://unused',
    } as AppConfig);
    vi.spyOn(prismaService, '$queryRaw').mockResolvedValue([
      { '?column?': 1 },
    ] as never);

    // Act
    const isHealthy = await prismaService.isHealthy();

    // Assert
    expect(isHealthy).toBe(true);
  });

  it('connects on module init and disconnects on destroy', async () => {
    // Arrange
    const prismaService = new PrismaService({
      databaseUrl: 'postgresql://unused',
    } as AppConfig);
    const connect = vi.spyOn(prismaService, '$connect').mockResolvedValue();
    const disconnect = vi
      .spyOn(prismaService, '$disconnect')
      .mockResolvedValue();

    // Act
    await prismaService.onModuleInit();
    await prismaService.onModuleDestroy();

    // Assert
    expect(connect).toHaveBeenCalledTimes(1);
    expect(disconnect).toHaveBeenCalledTimes(1);
  });
});
