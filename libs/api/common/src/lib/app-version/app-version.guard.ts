import {
  type CanActivate,
  type ExecutionContext,
  Inject,
  Injectable,
} from '@nestjs/common';

import type { Request } from 'express';

import {
  APP_HEADERS,
  appVersionSchema,
  isVersionSupported,
} from '@starter/shared/contracts';

import type { AppConfig } from '../config/app-config';
import { APP_CONFIG } from '../config/config.module';
import { ApiException } from '../errors/api.exception';
import { resolveAppPlatform } from '../http/app-platform';

/**
 * Rejects requests from app versions older than the minimum for their platform (CON-6, MOB-11).
 * Requests without a valid X-App-Version header (curl, health checks) pass.
 */
@Injectable()
export class AppVersionGuard implements CanActivate {
  constructor(@Inject(APP_CONFIG) private readonly config: AppConfig) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const version = appVersionSchema.safeParse(
      request.header(APP_HEADERS.version),
    );

    if (!version.success) {
      return true;
    }

    const minimumVersion =
      this.config.minimumAppVersions[resolveAppPlatform(request)];

    if (!isVersionSupported(version.data, minimumVersion)) {
      throw new ApiException(
        'APP_VERSION_UNSUPPORTED',
        `Version ${version.data} is no longer supported. Update the app.`,
      );
    }

    return true;
  }
}
