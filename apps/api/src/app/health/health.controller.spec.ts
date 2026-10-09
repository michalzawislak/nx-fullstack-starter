import { HttpStatus } from '@nestjs/common';
import { Test } from '@nestjs/testing';

import type { Response } from 'express';

import { PrismaService } from '@starter/api/database';

import { HealthController } from './health.controller';
import { HealthService } from './health.service';

async function createHealthController(
  isDatabaseUp: boolean,
): Promise<HealthController> {
  // Real HealthService resolved through DI, so missing decorator metadata would fail here.
  const moduleRef = await Test.createTestingModule({
    controllers: [HealthController],
    providers: [
      HealthService,
      {
        provide: PrismaService,
        useValue: { isHealthy: async () => isDatabaseUp },
      },
    ],
  }).compile();

  return moduleRef.get(HealthController);
}

describe('HealthController', () => {
  it('keeps 200 when everything works', async () => {
    // Arrange
    const healthController = await createHealthController(true);
    const response = { status: vi.fn() } as unknown as Response;

    // Act
    const healthStatus = await healthController.getHealth(response);

    // Assert
    expect(healthStatus.status).toBe('ok');
    expect(response.status).not.toHaveBeenCalled();
  });

  it('answers 503 when the database is down', async () => {
    // Arrange
    const healthController = await createHealthController(false);
    const response = { status: vi.fn() } as unknown as Response;

    // Act
    await healthController.getHealth(response);

    // Assert
    expect(response.status).toHaveBeenCalledWith(
      HttpStatus.SERVICE_UNAVAILABLE,
    );
  });
});
