import { Test } from '@nestjs/testing';

import { HealthController } from './health.controller';
import { HealthModule } from './health.module';

describe('HealthModule', () => {
  it('wires HealthController to HealthService through dependency injection', async () => {
    // Arrange
    const moduleRef = await Test.createTestingModule({
      imports: [HealthModule],
    }).compile();
    const healthController = moduleRef.get(HealthController);

    // Act
    const healthStatus = healthController.getHealth();

    // Assert
    expect(healthStatus.status).toBe('ok');
  });
});
