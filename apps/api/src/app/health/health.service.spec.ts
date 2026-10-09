import { Test } from '@nestjs/testing';

import { HealthService } from './health.service';

describe('HealthService', () => {
  let healthService: HealthService;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [HealthService],
    }).compile();

    healthService = moduleRef.get(HealthService);
  });

  it('reports ok status with a non-negative uptime', () => {
    // Arrange
    vi.spyOn(process, 'uptime').mockReturnValue(42.7);

    // Act
    const healthStatus = healthService.getStatus();

    // Assert
    expect(healthStatus).toEqual({ status: 'ok', uptimeSeconds: 42 });
  });
});
