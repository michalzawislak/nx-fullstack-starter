import { Controller, Get, HttpStatus, Res } from '@nestjs/common';

import type { Response } from 'express';

import { Public } from '@starter/api/common';

import { API_ROUTES, type HealthStatus } from '@starter/shared/contracts';

import { HealthService } from './health.service';

@Controller(API_ROUTES.health.controller)
export class HealthController {
  // NestJS has no inject() function; constructor injection is the framework's DI mechanism.
  constructor(private readonly healthService: HealthService) {}

  /** 200 when the API and the database work, 503 otherwise (for load balancers and uptime checks). */
  @Public()
  @Get()
  async getHealth(
    @Res({ passthrough: true }) response: Response,
  ): Promise<HealthStatus> {
    const healthStatus = await this.healthService.getStatus();

    if (healthStatus.status !== 'ok') {
      response.status(HttpStatus.SERVICE_UNAVAILABLE);
    }

    return healthStatus;
  }
}
