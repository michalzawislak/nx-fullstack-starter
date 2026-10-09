import { Injectable } from '@nestjs/common';

import { PrismaService } from '@starter/api/database';

import type { HealthStatus } from '@starter/shared/contracts';

@Injectable()
export class HealthService {
  constructor(private readonly prisma: PrismaService) {}

  async getStatus(): Promise<HealthStatus> {
    const isDatabaseUp = await this.prisma.isHealthy();

    return {
      status: isDatabaseUp ? 'ok' : 'error',
      uptimeSeconds: Math.floor(process.uptime()),
      database: isDatabaseUp ? 'up' : 'down',
    };
  }
}
