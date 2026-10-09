import { Controller, Get } from '@nestjs/common';
import type { HealthStatus } from './health-status';
import { HealthService } from './health.service';

@Controller('health')
export class HealthController {
  // NestJS has no inject() function; constructor injection is the framework's DI mechanism.
  constructor(private readonly healthService: HealthService) {}

  @Get()
  getHealth(): HealthStatus {
    return this.healthService.getStatus();
  }
}
