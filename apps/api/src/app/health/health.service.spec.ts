import { Test } from '@nestjs/testing';

import { PrismaService } from '@starter/api/database';

import { healthStatusSchema } from '@starter/shared/contracts';

import { HealthService } from './health.service';

async function createHealthService(
  isDatabaseUp: boolean,
): Promise<HealthService> {
  const moduleRef = await Test.createTestingModule({
    providers: [
      HealthService,
      {
        provide: PrismaService,
        useValue: { isHealthy: async () => isDatabaseUp },
      },
    ],
  }).compile();

  return moduleRef.get(HealthService);
}

describe('HealthService', () => {
  it('reports ok with whole seconds of uptime when the database answers', async () => {
    // Arrange
    vi.spyOn(process, 'uptime').mockReturnValue(42.7);
    const healthService = await createHealthService(true);

    // Act
    const healthStatus = await healthService.getStatus();

    // Assert
    expect(healthStatus).toEqual({
      status: 'ok',
      uptimeSeconds: 42,
      database: 'up',
    });
  });

  it('reports error when the database does not answer', async () => {
    // Arrange
    const healthService = await createHealthService(false);

    // Act
    const healthStatus = await healthService.getStatus();

    // Assert
    expect(healthStatus).toMatchObject({ status: 'error', database: 'down' });
    expect(healthStatusSchema.safeParse(healthStatus).success).toBe(true);
  });
});
