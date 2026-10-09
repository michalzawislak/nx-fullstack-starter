import { Controller, Get } from '@nestjs/common';

import { API_ROUTES, type HealthStatus } from '@starter/shared/contracts';

import { HealthService } from './health.service';

@Controller(API_ROUTES.health.controller)
export class HealthController {
  // NestJS has no inject() function; constructor injection is the framework's DI mechanism.
  constructor(private readonly healthService: HealthService) {}

  @Get()
  getHealth(): HealthStatus {
    return this.healthService.getStatus();
  }
}
