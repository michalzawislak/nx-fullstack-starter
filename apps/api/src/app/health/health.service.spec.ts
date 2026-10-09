import { Test } from '@nestjs/testing';

import { healthStatusSchema } from '@starter/shared/contracts';

import { HealthService } from './health.service';

describe('HealthService', () => {
  let healthService: HealthService;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [HealthService],
    }).compile();

    healthService = moduleRef.get(HealthService);
  });

  it('reports ok status with whole seconds of uptime', () => {
    // Arrange
    vi.spyOn(process, 'uptime').mockReturnValue(42.7);

    // Act
    const healthStatus = healthService.getStatus();

    // Assert
    expect(healthStatus).toEqual({ status: 'ok', uptimeSeconds: 42 });
  });

  it('returns a response that satisfies the shared contract', () => {
    // Act
    const result = healthStatusSchema.safeParse(healthService.getStatus());

    // Assert
    expect(result.success).toBe(true);
  });
});
