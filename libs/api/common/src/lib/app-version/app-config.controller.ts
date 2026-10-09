import { Controller, Get, Inject } from '@nestjs/common';

import {
  API_ROUTES,
  API_VERSION,
  type AppConfig as PublicAppConfig,
} from '@starter/shared/contracts';

import type { AppConfig } from '../config/app-config';
import { APP_CONFIG } from '../config/config.module';
import { Public } from '../http/public.decorator';

@Controller({ path: API_ROUTES.app.controller, version: API_VERSION })
export class AppConfigController {
  constructor(@Inject(APP_CONFIG) private readonly config: AppConfig) {}

  @Public()
  @Get(API_ROUTES.app.config)
  getConfig(): PublicAppConfig {
    return { minimumSupportedVersions: { ...this.config.minimumAppVersions } };
  }
}
