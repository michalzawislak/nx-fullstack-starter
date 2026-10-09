import { Injectable } from '@nestjs/common';

import type { HealthStatus } from '@starter/shared/contracts';

@Injectable()
export class HealthService {
  getStatus(): HealthStatus {
    return {
      status: 'ok',
      uptimeSeconds: Math.floor(process.uptime()),
    };
  }
}
