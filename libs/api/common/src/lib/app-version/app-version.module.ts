import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';

import { AppConfigController } from './app-config.controller';
import { AppVersionGuard } from './app-version.guard';

/** GET /v1/app/config and the global minimum-version check (CON-6). */
@Module({
  controllers: [AppConfigController],
  providers: [{ provide: APP_GUARD, useClass: AppVersionGuard }],
})
export class AppVersionModule {}
