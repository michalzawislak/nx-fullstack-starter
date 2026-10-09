import { Test } from '@nestjs/testing';
import { HealthController } from './health.controller';
import { HealthService } from './health.service';

describe('HealthController', () => {
  let healthController: HealthController;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        {
          provide: HealthService,
          useValue: { getStatus: () => ({ status: 'ok', uptimeSeconds: 7 }) },
        },
      ],
    }).compile();

    healthController = moduleRef.get(HealthController);
  });

  it('returns the status from HealthService', () => {
    // Arrange
    const expectedStatus = { status: 'ok', uptimeSeconds: 7 };

    // Act
    const healthStatus = healthController.getHealth();

    // Assert
    expect(healthStatus).toEqual(expectedStatus);
  });
});
